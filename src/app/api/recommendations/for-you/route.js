import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTasteBasedRecommendations, buildUserPreferenceProfile, ratingToWeight } from "@/lib/recommendation-engine";

// Simple in-memory cache for Jikan API responses
const jikanCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Request queue for rate limiting
const requestQueue = [];
let isProcessingQueue = false;

async function processQueue() {
    if (isProcessingQueue || requestQueue.length === 0) return;
    isProcessingQueue = true;

    while (requestQueue.length > 0) {
        const { url, resolve, reject } = requestQueue[0]; // Peek

        try {
            // Respect Jikan's rate limit: 3 req/sec => ~333ms. Using 400ms to be safe.
            await new Promise(r => setTimeout(r, 400));

            console.log(`[fetchJikan] Fetching: ${url}`);
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 429) {
                    console.warn(`[fetchJikan] Rate limited on ${url}, retrying...`);
                    // Wait longer and retry - don't shift queue yet
                    await new Promise(r => setTimeout(r, 1000));
                    continue;
                }
                throw new Error(`Jikan API error: ${response.status}`);
            }

            const data = await response.json();
            jikanCache.set(url, { data, timestamp: Date.now() });

            // Clean old cache entries (simple LRU)
            if (jikanCache.size > 100) {
                const firstKey = jikanCache.keys().next().value;
                jikanCache.delete(firstKey);
            }

            // Success - remove from queue and resolve
            requestQueue.shift();
            resolve(data);
        } catch (error) {
            console.error(`[fetchJikan] Error processing ${url}:`, error);
            requestQueue.shift(); // Remove failed request
            reject(error);
        }
    }

    isProcessingQueue = false;
}

/**
 * Fetch data from Jikan API with caching and queue-based rate limiting
 */
function fetchJikan(url, bypassCache = false) {
    // 1. Check cache first (sync) to avoid queue if possible
    if (!bypassCache) {
        const cached = jikanCache.get(url);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log(`[fetchJikan] Cache hit for: ${url}`);
            return Promise.resolve(cached.data);
        }
    } else {
        console.log(`[fetchJikan] Bypassing cache for: ${url}`);
    }

    // 2. Add to queue for network request
    return new Promise((resolve, reject) => {
        requestQueue.push({ url, resolve, reject });
        processQueue();
    });
}

/**
 * Fetch genre data for a series from Jikan
 */
async function fetchSeriesGenres(externalId, type) {
    try {
        const endpoint = type === 'anime' ? 'anime' : 'manga';
        const url = `https://api.jikan.moe/v4/${endpoint}/${externalId}/full`;
        const data = await fetchJikan(url);

        return data.data?.genres?.map(g => g.name) || [];
    } catch (error) {
        console.error(`Failed to fetch genres for ${type} ${externalId}:`, error);
        return [];
    }
}

/**
 * Map genre names to Jikan genre IDs
 */
const GENRE_MAP = {
    'Action': 1, 'Adventure': 2, 'Comedy': 4, 'Drama': 8,
    'Fantasy': 10, 'Horror': 14, 'Mystery': 7, 'Romance': 22,
    'Sci-Fi': 24, 'Slice of Life': 36, 'Sports': 30, 'Supernatural': 37,
    'Thriller': 41, 'Psychological': 40, 'Shounen': 27, 'Seinen': 42
};

/**
 * Fetch candidate series from Jikan for a SINGLE genre
 * @param {String} genre - Single genre name
 * @param {String} type - anime or manga
 * @param {Number} limit - Max results
 */
async function fetchCandidatesForGenre(genre, type, limit = 10) {
    try {
        const genreId = GENRE_MAP[genre];
        if (!genreId) {
            return [];
        }

        const endpoint = type === 'anime' ? 'anime' : 'manga';
        let typeParam = '';
        if (type === 'manhwa') {
            typeParam = '&type=manhwa';
        }

        const url = `https://api.jikan.moe/v4/${endpoint}?genres=${genreId}&order_by=score&sort=desc&limit=${limit}${typeParam}`;

        const data = await fetchJikan(url);

        return (data.data || []).map(item => ({
            externalId: item.mal_id?.toString(),
            title: item.title,
            type: type,
            thumbnailUrl: item.images?.jpg?.image_url,
            genres: item.genres?.map(g => g.name) || [],
            jikanScore: item.score,
            episodes: item.episodes || null,
            chapters: item.chapters || null,
            status: item.status,
            synopsis: item.synopsis
        }));
    } catch (error) {
        console.error(`Failed to fetch candidates for ${genre} ${type}:`, error);
        return [];
    }
}


/**
 * Fetch REAL trending data from AniList (Activity-based)
 * This is much better for "Trending on the internet" than MAL's Top Rated Airing
 */
async function fetchAniListTrending(type, limit = 5, page = 1) {
    const aniListType = type === 'anime' ? 'ANIME' : 'MANGA';
    const isManhwa = type === 'manhwa';
    const countryFilter = isManhwa ? ', countryOfOrigin: "KR"' : '';

    // For Manga (JP), exclude KR/CN to separate them from Manhwa
    const formatFilter = (type === 'manga') ? ', countryOfOrigin: "JP"' : '';

    const query = `
    query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
            media(type: ${aniListType}, sort: TRENDING_DESC, isAdult: false${countryFilter}${formatFilter}) {
                idMal
                title {
                    romaji
                    english
                    native
                }
                coverImage {
                    extraLarge
                    large
                }
                description
                averageScore
                episodes
                chapters
                status
                genres
                type
                format
            }
        }
    }
    `;

    try {
        console.log(`[fetchAniListTrending] Fetching ${type} page ${page}`);
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: { page, perPage: limit }
            }),
            next: { revalidate: 3600 } // Next.js dedicated cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`AniList API error: ${response.status}`);
        }

        const data = await response.json();
        const items = data.data?.Page?.media || [];

        return items.map(item => ({
            externalId: item.idMal?.toString() || null, // Some webtoons lack MAL ID, handling this is tricky but UI needs externalId
            title: item.title?.english || item.title?.romaji,
            type: type, // Force our internal type
            thumbnailUrl: item.coverImage?.extraLarge || item.coverImage?.large,
            genres: item.genres || [],
            jikanScore: item.averageScore ? item.averageScore / 10 : null, // Convert 100-scale to 10-scale
            episodes: item.episodes,
            chapters: item.chapters,
            status: mapAniListStatus(item.status),
            synopsis: item.description?.replace(/<[^>]*>/g, '') || '', // Strip HTML
            reason: `Trending #${items.indexOf(item) + 1 + ((page - 1) * limit)}`
        })).filter(i => i.externalId); // Filter out items without MAL IDs to maintain compatibility with Jikan-based system
    } catch (error) {
        console.error(`[fetchAniListTrending] Error:`, error);
        return [];
    }
}

function mapAniListStatus(status) {
    if (status === 'FINISHED') return 'Finished';
    if (status === 'RELEASING') return 'Publishing';
    if (status === 'NOT_YET_RELEASED') return 'Not Yet Released';
    if (status === 'CANCELLED') return 'Cancelled';
    if (status === 'HIATUS') return 'Hiatus';
    return status;
}

/**
 * Fetch metadata (chapters, episodes, status) from AniList
 * Useful because Jikan/MAL often has missing data for Manhwa/Webtoons
 */
async function fetchAniListMetadata(malIds) {
    if (!malIds || malIds.length === 0) return {};
    console.log(`[AniList] Fetching metadata for ${malIds.length} IDs:`, malIds);

    try {
        const query = `
        query ($ids: [Int]) {
            Page(page: 1, perPage: 50) {
                media(idMal_in: $ids) {
                    idMal
                    episodes
                    chapters
                    status
                }
            }
        }
        `;

        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables: { ids: malIds }
            })
        });

        if (!response.ok) return {};

        const data = await response.json();
        const mediaList = data.data?.Page?.media || [];
        console.log(`[AniList] Got ${mediaList.length} results from AniList`);

        const metadataMap = {};
        mediaList.forEach(m => {
            if (m.idMal) {
                metadataMap[m.idMal] = {
                    episodes: m.episodes,
                    chapters: m.chapters,
                    status: m.status // FINISHED, RELEASING, etc.
                };
            }
        });

        return metadataMap;
    } catch (error) {
        console.error('AniList Metadata Fetch Error:', error);
        return {};
    }
}

/**
 * enrich recommendations with AniList data
 */
async function enrichWithAniList(items) {
    const uniqueIds = [...new Set(items.map(i => parseInt(i.externalId)).filter(id => !isNaN(id)))];
    if (uniqueIds.length === 0) return items;

    const metadata = await fetchAniListMetadata(uniqueIds);

    return items.map(item => {
        const id = parseInt(item.externalId);
        const meta = metadata[id];
        if (!meta) return item;

        // Merge logic: prefer AniList checks if Jikan is null
        // Also map AniList status to our UI format
        let status = item.status;
        if (meta.status === 'FINISHED') status = 'Finished';
        else if (meta.status === 'RELEASING') status = 'Publishing';
        else if (meta.status === 'NOT_YET_RELEASED') status = 'Not Yet Released';
        else if (meta.status === 'CANCELLED') status = 'Cancelled';
        else if (meta.status === 'HIATUS') status = 'Hiatus';

        return {
            ...item,
            episodes: meta.episodes || item.episodes,
            chapters: meta.chapters || item.chapters,
            status: status || item.status
        };
    });
}

/**
 * GET /api/recommendations/for-you
 * Returns personalized recommendations based on user's blended preferences
 * Query params:
 *   - page: Page number for pagination (default 0)
 *   - exclude: Comma-separated IDs to exclude from results
 *   - type: Filter by type (anime, manga, manhwa)
 *   - single: If true, return only 1 recommendation
 *   - limit: Custom limit for results
 */
export async function GET(request) {
    if (!prisma) {
        return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0', 10);
    const excludeParam = searchParams.get('exclude') || '';
    const excludeIds = excludeParam ? excludeParam.split(',').filter(Boolean) : [];
    const typeFilter = searchParams.get('type');
    const singleMode = searchParams.get('single') === 'true';
    const customLimit = parseInt(searchParams.get('limit') || '0', 10);
    const bypassCache = !!searchParams.get('_t');

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch user's series with ratings
        const userSeries = await prisma.userSeries.findMany({
            where: { userId: session.user.id },
            select: { series: { select: { externalId: true } } }
        });

        // TYPE-SPECIFIC REQUEST: When type filter is specified
        if (typeFilter) {
            const jikanPage = Math.max(1, page + 1);
            const limit = customLimit || 10;
            const fetchLimit = limit;

            let topRated = [];
            if (typeFilter === 'anime') {
                topRated = await fetchAniListTrending('anime', fetchLimit, jikanPage);
            } else if (typeFilter === 'manga') {
                topRated = await fetchAniListTrending('manga', fetchLimit, jikanPage);
            } else if (typeFilter === 'manhwa') {
                topRated = await fetchAniListTrending('manhwa', fetchLimit, jikanPage);
            }

            // Enrich with AniList data (episodes/chapters)
            topRated = await enrichWithAniList(topRated);

            console.log(`[API] Type filter ${typeFilter}: returning ${topRated.length} items from page ${jikanPage}`);

            return NextResponse.json({
                recommendations: topRated,
                count: topRated.length,
                tier: 'type_filter',
                page: page
            });
        }

        // GLOBAL TRENDING SELECTION (For Dashboard)
        // Always show trending, regardless of user history (Tier 1 logic for everyone)

        const jikanPage = Math.max(1, page + 1);
        const limit = customLimit || (singleMode ? 3 : 10);
        // fetchLimit same as limit since we aren't filtering anymore
        const fetchLimit = limit;

        // Fetch all 3 types: anime, manga, and manhwa
        const [topAnime, topManga, topManhwa] = await Promise.all([
            fetchAniListTrending('anime', 10, jikanPage),
            fetchAniListTrending('manga', 10, jikanPage),
            fetchAniListTrending('manhwa', 10, jikanPage)
        ]);

        let topRated = [...topAnime, ...topManga, ...topManhwa];

        // Apply limit only if single mode (refreshing one card)
        if (singleMode) {
            topRated = topRated.slice(0, 1);
        }

        // Enrich with AniList data
        topRated = await enrichWithAniList(topRated);

        return NextResponse.json({
            recommendations: topRated,
            count: topRated.length,
            tier: 'new_user', // Keep 'new_user' trigger to show "Trending Now" title on frontend
            page: page,
            message: 'Global trending hits right now'
        });
    } catch (error) {
        console.error("Taste-Based Recommendations Error:", error);
        return NextResponse.json(
            { error: "Failed to generate recommendations", details: error.message },
            { status: 500 }
        );
    }
}
