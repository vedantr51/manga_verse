/**
 * Rule-based recommendation engine for MangaVerse
 * Generates personalized recommendations using user data (ratings, progress, completion)
 * No AI/LLM dependencies - pure deterministic logic
 * 
 * v2.0 - Blended multi-signal preference model
 */

/**
 * Convert rating to weight for preference calculations
 * @param {Number} rating - User rating (1-5)
 * @returns {Number} Weight (0-1)
 */
export function ratingToWeight(rating) {
    const r = parseFloat(rating) || 0;
    if (r >= 5.0) return 1.0;
    if (r >= 4.5) return 0.8;
    if (r >= 4.0) return 0.6;
    if (r >= 3.5) return 0.4;
    return 0;
}

/**
 * Generate "Continue Watching/Reading" recommendations
 * Returns series with active status, sorted by most recent activity
 * @param {Array} userSeries - User's series with status and updatedAt
 * @returns {Array} Recommendations with explanation
 */
export function generateContinueRecommendations(userSeries) {
    if (!userSeries || userSeries.length === 0) {
        return [];
    }

    // Filter for active series (watching or reading)
    const activeSeries = userSeries.filter(item =>
        item.status === 'watching' || item.status === 'reading'
    );

    // Sort by most recently updated
    const sorted = activeSeries.sort((a, b) =>
        new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    // Return top 5 with explanation
    return sorted.slice(0, 5).map(item => ({
        id: item.id,
        title: item.series?.title || item.title,
        type: item.series?.type || item.type,
        thumbnailUrl: item.series?.thumbnailUrl || item.thumbnailUrl,
        lastProgress: item.lastProgress,
        updatedAt: item.updatedAt,
        status: item.status,
        reason: "Continue where you left off",
        recommendationType: "continue"
    }));
}

/**
 * Build user preference profile from rated series
 * Uses weighted aggregation from all qualifying series (rating >= 3.5)
 * @param {Array} userSeries - User's series with ratings
 * @param {Object} genreData - Map of seriesId -> genres from Jikan
 * @returns {Object} User preference profile
 */
export function buildUserPreferenceProfile(userSeries, genreData = {}) {
    const profile = {
        topGenres: [],
        genreWeights: {}, // { "Action": { weight: 2.4, count: 3 } }
        preferredTypes: {},
        qualifyingSeries: [], // Series with rating >= 3.5
        completedCount: 0,
        droppedCount: 0
    };

    if (!userSeries || userSeries.length === 0) {
        return profile;
    }

    // Track weighted genre preferences
    const genreWeights = {}; // { "Action": { weight: 0, count: 0 } }
    const typeWeights = { anime: { weight: 0, count: 0 }, manga: { weight: 0, count: 0 }, manhwa: { weight: 0, count: 0 } };

    userSeries.forEach(item => {
        const rating = parseFloat(item.rating) || 0;
        const weight = ratingToWeight(rating);
        const type = item.series?.type || item.type;
        const seriesId = item.series?.id || item.seriesId;

        // Track qualifying series (>= 3.5 rating)
        if (weight > 0) {
            profile.qualifyingSeries.push({
                id: seriesId,
                title: item.series?.title || item.title,
                type,
                rating,
                weight,
                externalId: item.series?.externalId || item.externalId
            });
        }

        // Track weighted type preferences
        if (weight > 0 && type) {
            if (!typeWeights[type]) typeWeights[type] = { weight: 0, count: 0 };
            typeWeights[type].weight += weight;
            typeWeights[type].count++;
        }

        // Track weighted genre preferences
        if (weight > 0 && genreData[seriesId]) {
            genreData[seriesId].forEach(genre => {
                if (!genreWeights[genre]) {
                    genreWeights[genre] = { weight: 0, count: 0 };
                }
                genreWeights[genre].weight += weight;
                genreWeights[genre].count++;
            });
        }

        // Track completion patterns
        if (item.status === 'completed') profile.completedCount++;
        if (item.status === 'dropped') profile.droppedCount++;
    });

    // Calculate normalized type preferences
    Object.keys(typeWeights).forEach(type => {
        const data = typeWeights[type];
        if (data.count > 0) {
            profile.preferredTypes[type] = {
                avg: data.weight / data.count,
                totalWeight: data.weight,
                count: data.count
            };
        }
    });

    // Store genre weights and compute top genres
    profile.genreWeights = genreWeights;
    profile.topGenres = Object.entries(genreWeights)
        .map(([genre, data]) => ({
            genre,
            weight: data.weight,
            count: data.count,
            avgWeight: data.weight / data.count
        }))
        .sort((a, b) => b.weight - a.weight) // Sort by total weight
        .slice(0, 6) // Top 6 genres
        .map(g => g.genre);

    return profile;
}

/**
 * Extract franchise base name from title
 * e.g., "Naruto: Shippuden" -> "Naruto", "Attack on Titan: Final Season" -> "Attack on Titan"
 * @param {String} title - Series title
 * @returns {String} Base franchise name
 */
export function extractFranchise(title) {
    if (!title) return '';
    return title
        .split(':')[0]
        .split(' - ')[0]
        .split(' Season')[0]
        .split(' Part')[0]
        .trim()
        .toLowerCase();
}

/**
 * Score a candidate series based on user preferences (blended model)
 * @param {Object} candidate - Candidate series with genres
 * @param {Object} userProfile - User preference profile
 * @returns {Number} Score between 0-1
 */
export function scoreSeriesByPreference(candidate, userProfile) {
    let score = 0;

    // 1. Genre match score (60% weight) - using weighted genre preferences
    if (candidate.genres && candidate.genres.length > 0 && Object.keys(userProfile.genreWeights).length > 0) {
        let genreScore = 0;
        let maxPossibleGenreScore = 0;

        candidate.genres.forEach(genre => {
            if (userProfile.genreWeights[genre]) {
                genreScore += userProfile.genreWeights[genre].weight;
            }
            maxPossibleGenreScore += 2; // Assume max weight of 2 per genre
        });

        if (maxPossibleGenreScore > 0) {
            score += (genreScore / maxPossibleGenreScore) * 0.6;
        }
    }

    // 2. Type preference score (25% weight)
    if (candidate.type && userProfile.preferredTypes[candidate.type]) {
        const typeData = userProfile.preferredTypes[candidate.type];
        const typeScore = Math.min(typeData.avg, 1); // Normalize to 0-1
        score += typeScore * 0.25;
    }

    // 3. Quality score from Jikan (15% weight)
    if (candidate.jikanScore) {
        const qualityScore = candidate.jikanScore / 10; // Jikan scores are 0-10
        score += qualityScore * 0.15;
    }

    return score;
}

/**
 * Generate concise blended explanation
 * @param {Object} candidate - Recommended series
 * @param {Object} userProfile - User preference profile
 * @returns {String} Short human-readable explanation
 */
export function explainRecommendation(candidate, userProfile) {
    const matchingGenres = candidate.genres?.filter(g =>
        userProfile.topGenres.includes(g)
    ) || [];

    // Get top qualifying series (max 2 for brevity)
    const relatedSeries = userProfile.qualifyingSeries
        .filter(s => s.rating >= 4)
        .slice(0, 2);

    // Strategy 1: Reference 2 series max
    if (relatedSeries.length >= 2) {
        return `You liked ${relatedSeries[0].title.split(':')[0]} & ${relatedSeries[1].title.split(':')[0]}`;
    }

    // Strategy 2: Genre match
    if (matchingGenres.length >= 2) {
        return `${matchingGenres[0]} + ${matchingGenres[1]}`;
    }

    // Strategy 3: Single genre with type
    if (matchingGenres.length > 0 && candidate.type) {
        return `${matchingGenres[0]} ${candidate.type}`;
    }

    // Strategy 4: Single series
    if (relatedSeries.length === 1) {
        return `Similar to ${relatedSeries[0].title.split(':')[0]}`;
    }

    // Fallback
    return `For you`;
}

/**
 * Filter out series already in user's library
 * @param {Array} candidates - Candidate series
 * @param {Array} userSeries - User's existing series
 * @returns {Array} Filtered candidates
 */
export function filterExistingSeries(candidates, userSeries) {
    if (!userSeries || userSeries.length === 0) {
        return candidates;
    }

    const existingExternalIds = new Set(
        userSeries
            .map(s => s.series?.externalId || s.externalId)
            .filter(Boolean)
    );

    const existingTitles = new Set(
        userSeries
            .map(s => s.series?.title || s.title)
            .filter(Boolean)
            .map(t => t.toLowerCase())
    );

    return candidates.filter(candidate => {
        // Filter by externalId (most reliable)
        if (candidate.externalId && existingExternalIds.has(candidate.externalId)) {
            return false;
        }
        // Filter by title (fallback)
        if (candidate.title && existingTitles.has(candidate.title.toLowerCase())) {
            return false;
        }
        return true;
    });
}

/**
 * Deduplicate candidates by franchise to ensure diversity
 * @param {Array} candidates - Scored candidates
 * @param {Number} maxPerFranchise - Max entries per franchise
 * @returns {Array} Deduplicated candidates
 */
export function deduplicateByFranchise(candidates, maxPerFranchise = 1) {
    const franchiseCounts = {};
    const result = [];

    for (const candidate of candidates) {
        const franchise = extractFranchise(candidate.title);
        franchiseCounts[franchise] = (franchiseCounts[franchise] || 0) + 1;

        if (franchiseCounts[franchise] <= maxPerFranchise) {
            result.push(candidate);
        }
    }

    return result;
}

/**
 * Generate taste-based recommendations using blended preference model
 * @param {Array} userSeries - User's series with ratings
 * @param {Array} candidatePool - Pool of candidate series to recommend from
 * @param {Object} genreData - Map of seriesId -> genres for user's series
 * @returns {Array} Top recommendations with explanations
 */
export function generateTasteBasedRecommendations(userSeries, candidatePool, genreData = {}) {
    if (!userSeries || userSeries.length === 0 || !candidatePool || candidatePool.length === 0) {
        return [];
    }

    // Build user preference profile with weighted aggregation
    const userProfile = buildUserPreferenceProfile(userSeries, genreData);

    // Need at least some qualifying series to make recommendations
    if (userProfile.qualifyingSeries.length === 0) {
        return [];
    }

    // Filter out series already in library
    const filteredCandidates = filterExistingSeries(candidatePool, userSeries);

    // Score and rank candidates
    const scoredCandidates = filteredCandidates.map(candidate => ({
        ...candidate,
        score: scoreSeriesByPreference(candidate, userProfile),
        reason: explainRecommendation(candidate, userProfile)
    }));

    // Sort by score
    const sortedCandidates = scoredCandidates
        .filter(c => c.score > 0.2) // Lower threshold for blended model
        .sort((a, b) => b.score - a.score);

    // Deduplicate by franchise for diversity
    const diverseCandidates = deduplicateByFranchise(sortedCandidates, 1);

    // Return top 10
    return diverseCandidates
        .slice(0, 10)
        .map(c => ({
            externalId: c.externalId,
            title: c.title,
            type: c.type,
            thumbnailUrl: c.thumbnailUrl || c.image_url,
            genres: c.genres,
            score: Math.round(c.score * 100) / 100,
            reason: c.reason,
            jikanScore: c.jikanScore,
            recommendationType: "taste-based"
        }));
}
