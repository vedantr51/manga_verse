import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTasteBasedRecommendations, buildUserPreferenceProfile, ratingToWeight } from "@/lib/recommendation-engine";

// Simple in-memory cache for Jikan API responses
const jikanCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Fetch data from Jikan API with caching and rate limiting
 */
async function fetchJikan(url, bypassCache = false) {
    if (!bypassCache) {
        const cached = jikanCache.get(url);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            console.log(`[fetchJikan] Cache hit for: ${url}`);
            return cached.data;
        }
    } else {
        console.log(`[fetchJikan] Bypassing cache for: ${url}`);
    }

    // Rate limiting: wait 350ms between requests (3 req/sec max)
    await new Promise(resolve => setTimeout(resolve, 350));

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Jikan API error: ${response.status}`);
    }

    const data = await response.json();
    jikanCache.set(url, { data, timestamp: Date.now() });

    // Clean old cache entries (simple LRU)
    if (jikanCache.size > 100) {
        const firstKey = jikanCache.keys().next().value;
        jikanCache.delete(firstKey);
    }

    return data;
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
        const url = `https://api.jikan.moe/v4/${endpoint}?genres=${genreId}&order_by=score&sort=desc&limit=${limit}`;

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
 * Fetch top-rated series from Jikan (for new users)
 * @param {String} type - anime or manga
 * @param {Number} limit - Max results
 * @param {Number} page - Page number for offset (starts at 1 for Jikan)
 */
async function fetchTopRated(type, limit = 5, page = 1, bypassCache = false) {
    const endpoint = type === 'anime' ? 'anime' : 'manga';
    const url = `https://api.jikan.moe/v4/top/${endpoint}?limit=${limit}&page=${page}`;
    console.log(`[fetchTopRated] Fetching: ${url}`);

    const data = await fetchJikan(url, bypassCache);
    console.log(`[fetchTopRated] Got ${data?.data?.length || 0} items for ${type}`);

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
        synopsis: item.synopsis,
        reason: `Top Rated ${type.charAt(0).toUpperCase() + type.slice(1)}`
    }));
}

/**
 * Fetch top-rated manhwa (Korean manga) from Jikan
 * Uses the type=manhwa filter to get only Korean comics
 * @param {Number} limit - Max results
 * @param {Number} page - Page number for offset
 */
async function fetchTopManhwa(limit = 5, page = 1, bypassCache = false) {
    // Jikan manga search with type=manhwa filter for Korean comics
    // Order by score to get top-rated
    const url = `https://api.jikan.moe/v4/manga?type=manhwa&order_by=score&sort=desc&limit=${limit}&page=${page}&min_score=7`;
    console.log(`[fetchTopManhwa] Fetching: ${url}`);

    const data = await fetchJikan(url, bypassCache);
    console.log(`[fetchTopManhwa] Got ${data?.data?.length || 0} items`);

    return (data.data || []).map(item => ({
        externalId: item.mal_id?.toString(),
        title: item.title,
        type: 'manhwa',
        thumbnailUrl: item.images?.jpg?.image_url,
        genres: item.genres?.map(g => g.name) || [],
        jikanScore: item.score,
        chapters: item.chapters || null,
        status: item.status,
        synopsis: item.synopsis,
        reason: 'Top Rated Manhwa'
    }));
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
            include: {
                series: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        thumbnailUrl: true,
                        externalId: true
                    }
                }
            }
        });

        // Need at least some rated series (lowered threshold to 3.5)
        const qualifyingSeries = userSeries.filter(s =>
            s.rating && ratingToWeight(s.rating) > 0
        );

        const ratedCount = qualifyingSeries.length;

        // TYPE-SPECIFIC REQUEST: When type filter is specified, directly fetch for that type
        // This is used for Refresh and See More buttons regardless of user tier
        if (typeFilter) {
            const jikanPage = Math.max(1, page + 1);
            const limit = customLimit || 10;
            const fetchLimit = limit * 3; // Fetch extra to account for excludes

            let topRated = [];
            if (typeFilter === 'anime') {
                topRated = await fetchTopRated('anime', fetchLimit, jikanPage, bypassCache);
            } else if (typeFilter === 'manga') {
                topRated = await fetchTopRated('manga', fetchLimit, jikanPage, bypassCache);
            } else if (typeFilter === 'manhwa') {
                topRated = await fetchTopManhwa(fetchLimit, jikanPage, bypassCache);
            }

            // Filter out excluded IDs
            topRated = topRated.filter(r => !excludeIds.includes(r.externalId));

            // Also filter out items already in user's library
            const userExternalIds = userSeries.map(s => s.series?.externalId).filter(Boolean);
            topRated = topRated.filter(r => !userExternalIds.includes(r.externalId));

            // Apply limit
            const finalLimit = singleMode ? 1 : (customLimit || 10);
            topRated = topRated.slice(0, finalLimit);

            // Enrich with AniList data
            topRated = await enrichWithAniList(topRated);

            console.log(`[API] Type filter ${typeFilter}: returning ${topRated.length} items from page ${jikanPage}`);

            return NextResponse.json({
                recommendations: topRated,
                count: topRated.length,
                tier: 'type_filter',
                page: page
            });
        }

        // TIER 1: New user (no library or no ratings) - Show top-rated content
        if (userSeries.length === 0 || ratedCount === 0) {
            const jikanPage = Math.max(1, page + 1); // Jikan uses 1-indexed pages, minimum 1
            // Default: 10 per type initially, customLimit for See More/Refresh
            const limit = customLimit || (singleMode ? 3 : 10);
            // Fetch extra to account for excludes
            const fetchLimit = limit * 3;

            // Fetch based on type filter or all types
            let topRated = [];
            if (typeFilter === 'anime') {
                topRated = await fetchTopRated('anime', fetchLimit, jikanPage);
            } else if (typeFilter === 'manga') {
                topRated = await fetchTopRated('manga', fetchLimit, jikanPage);
            } else if (typeFilter === 'manhwa') {
                // Fetch actual Korean manhwa using the dedicated function
                topRated = await fetchTopManhwa(fetchLimit, jikanPage);
            } else {
                // Fetch all 3 types: anime, manga, and manhwa (10 each = 30 total)
                const [topAnime, topManga, topManhwa] = await Promise.all([
                    fetchTopRated('anime', 10, jikanPage),
                    fetchTopRated('manga', 10, jikanPage),
                    fetchTopManhwa(10, jikanPage) // Actual Korean manhwa
                ]);

                topRated = [...topAnime, ...topManga, ...topManhwa];
            }

            // Filter out excluded IDs
            topRated = topRated.filter(r => !excludeIds.includes(r.externalId));

            // Apply limit (30 for initial load, customLimit for See More)
            const finalLimit = singleMode ? 1 : (customLimit || 30);
            topRated = topRated.slice(0, finalLimit);

            // Enrich with AniList data
            topRated = await enrichWithAniList(topRated);

            return NextResponse.json({
                recommendations: topRated,
                count: topRated.length,
                tier: 'new_user',
                page: page,
                message: 'Top rated picks to get you started!'
            });
        }

        // TIER 2: Early-stage user (1-3 rated series) - Blend top-rated with personalized
        if (ratedCount >= 1 && ratedCount <= 3) {
            // Fetch some top-rated as fallback
            const [topAnime, topManga] = await Promise.all([
                fetchTopRated('anime', 3),
                fetchTopRated('manga', 3)
            ]);
            const topRated = [...topAnime, ...topManga].map(item => ({
                ...item,
                reason: item.reason || 'Top Rated'
            }));

            // Also try to get some personalized recommendations
            const genreData = {};
            const genreFetchPromises = qualifyingSeries
                .filter(s => s.series?.externalId)
                .slice(0, 3)
                .map(async (s) => {
                    const genres = await fetchSeriesGenres(s.series.externalId, s.series.type);
                    genreData[s.series.id] = genres;
                });

            await Promise.all(genreFetchPromises);

            const userProfile = buildUserPreferenceProfile(userSeries, genreData);

            // Fetch personalized candidates if we have genre data
            let personalizedCandidates = [];
            if (userProfile.topGenres.length > 0) {
                const topGenre = userProfile.topGenres[0];
                const preferredType = Object.keys(userProfile.preferredTypes)[0] || 'manga';
                personalizedCandidates = await fetchCandidatesForGenre(topGenre, preferredType, 5);
                personalizedCandidates = personalizedCandidates.map(c => ({
                    ...c,
                    reason: `Because you like ${topGenre}`
                }));
            }

            // Blend: prioritize personalized, fill with top-rated
            const seenIds = new Set(userSeries.map(s => s.series?.externalId).filter(Boolean));
            let blended = [...personalizedCandidates, ...topRated]
                .filter(item => !seenIds.has(item.externalId))
                .slice(0, 10);

            // Enrich with AniList data
            blended = await enrichWithAniList(blended);

            return NextResponse.json({
                recommendations: blended,
                count: blended.length,
                tier: 'early_stage',
                message: 'Building your taste profile...',
                userProfile: {
                    ratedCount,
                    topGenres: userProfile.topGenres.slice(0, 3)
                }
            });
        }

        // TIER 3: Established user (4+ rated series) - Full personalized recommendations

        // Fetch genre data for ALL qualifying series (not just top 5)
        const genreData = {};
        const genreFetchPromises = qualifyingSeries
            .filter(s => s.series?.externalId)
            .slice(0, 8) // Increased limit for better coverage
            .map(async (s) => {
                const genres = await fetchSeriesGenres(s.series.externalId, s.series.type);
                genreData[s.series.id] = genres;
            });

        await Promise.all(genreFetchPromises);

        // Build user preference profile with blended weights
        const userProfile = buildUserPreferenceProfile(userSeries, genreData);

        // Fetch candidates for MULTIPLE genres (not just first one)
        const candidatePromises = [];
        const topGenres = userProfile.topGenres.slice(0, 3); // Top 3 genres
        const preferredTypes = Object.keys(userProfile.preferredTypes)
            .filter(type => userProfile.preferredTypes[type].avg >= 0.4)
            .slice(0, 2);

        // Fetch candidates for each genre x type combination
        for (const genre of topGenres) {
            for (const type of preferredTypes) {
                candidatePromises.push(
                    fetchCandidatesForGenre(genre, type, 8)
                );
            }
        }

        // If no candidates from genres, try a fallback
        if (candidatePromises.length === 0 && preferredTypes.length > 0) {
            candidatePromises.push(
                fetchCandidatesForGenre('Action', preferredTypes[0], 15)
            );
        }

        const candidateArrays = await Promise.all(candidatePromises);

        // Deduplicate candidates by externalId
        const seenIds = new Set();
        const candidatePool = candidateArrays.flat().filter(c => {
            if (seenIds.has(c.externalId)) return false;
            seenIds.add(c.externalId);
            return true;
        });

        // Generate recommendations with blended model
        let recommendations = generateTasteBasedRecommendations(
            userSeries,
            candidatePool,
            genreData
        );

        // Enrich with AniList data
        recommendations = await enrichWithAniList(recommendations);

        return NextResponse.json({
            recommendations,
            count: recommendations.length,
            userProfile: {
                topGenres: userProfile.topGenres,
                preferredTypes: Object.keys(userProfile.preferredTypes),
                qualifyingSeriesCount: userProfile.qualifyingSeries.length
            }
        });
    } catch (error) {
        console.error("Taste-Based Recommendations Error:", error);
        return NextResponse.json(
            { error: "Failed to generate recommendations", details: error.message },
            { status: 500 }
        );
    }
}
