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
async function fetchJikan(url) {
    const cached = jikanCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
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
            synopsis: item.synopsis
        }));
    } catch (error) {
        console.error(`Failed to fetch candidates for ${genre} ${type}:`, error);
        return [];
    }
}

/**
 * GET /api/recommendations/for-you
 * Returns personalized recommendations based on user's blended preferences
 */
export async function GET() {
    if (!prisma) {
        return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

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

        if (qualifyingSeries.length === 0) {
            return NextResponse.json({
                recommendations: [],
                count: 0,
                message: "Rate more series to get personalized recommendations"
            });
        }

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
        const recommendations = generateTasteBasedRecommendations(
            userSeries,
            candidatePool,
            genreData
        );

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
