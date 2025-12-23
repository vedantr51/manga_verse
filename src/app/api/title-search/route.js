import { NextResponse } from "next/server";

// Cache for search results to avoid hitting API limits
// Map<query_type, { data: result, timestamp: number }>
const searchCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "anime"; // anime, manga

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    // Check cache first
    const cacheKey = `${type}_${query.toLowerCase().trim()}`;
    const cached = searchCache.get(cacheKey);

    if (cached) {
        const age = Date.now() - cached.timestamp;
        if (age < CACHE_TTL) {
            return NextResponse.json({ results: cached.data });
        }
        searchCache.delete(cacheKey);
    }

    try {
        // Map our types to Jikan types if needed
        // Jikan supports: anime, manga
        // We support: anime, manga, manhwa (manhwa is a type of manga in Jikan usually, strictly we might search 'manga' with type=manhwa but Jikan search handles it)

        // Jikan query parameters
        // q: query
        // limit: limit results
        // sfw: safe for work (good to enable)
        // type: anime or manga

        const apiType = type === "anime" ? "anime" : "manga";
        const url = `https://api.jikan.moe/v4/${apiType}?q=${encodeURIComponent(query)}&limit=5&sfw=true&order_by=popularity&sort=asc`;

        const res = await fetch(url);

        if (!res.ok) {
            // Handle rate limiting gracefully
            if (res.status === 429) {
                console.warn("Jikan API rate limit reached");
                return NextResponse.json({ results: [], error: "Rate limit reached" });
            }
            throw new Error(`Jikan API responded with ${res.status}`);
        }

        const data = await res.json();

        // Transform Jikan response to our format
        const results = data.data.map(item => ({
            externalId: item.mal_id.toString(),
            title: item.title, // Canonical title
            alternateTitles: [
                item.title_english,
                item.title_japanese,
                ...(item.titles?.map(t => t.title) || [])
            ].filter(Boolean).filter(t => t !== item.title), // Remove nulls and duplicates
            thumbnailUrl: item.images?.webp?.image_url || item.images?.jpg?.image_url,
            type: type, // Keep original requested type (e.g. if user selected manhwa, we keep it manhwa even if searched as manga)
            synopsis: item.synopsis,
            year: item.year || (item.published?.from ? new Date(item.published.from).getFullYear() : null),
            score: item.score
        }));

        // Filter out obvious duplicates by externalId
        const uniqueResults = [];
        const seenIds = new Set();

        for (const item of results) {
            if (!seenIds.has(item.externalId)) {
                seenIds.add(item.externalId);
                uniqueResults.push(item);
            }
        }

        // Cache the result
        searchCache.set(cacheKey, {
            data: uniqueResults,
            timestamp: Date.now()
        });

        // Prune cache if too large (simple implementation)
        if (searchCache.size > 500) {
            const firstKey = searchCache.keys().next().value;
            searchCache.delete(firstKey);
        }

        return NextResponse.json({ results: uniqueResults });
    } catch (error) {
        console.error("Search API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch suggestions" },
            { status: 500 }
        );
    }
}
