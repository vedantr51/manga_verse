/**
 * Core logic for deriving user insights from library data.
 * Pure functions only - no database calls.
 */

export const METRICS = {
    INACTIVITY_THRESHOLD_DAYS: 30,
};

/**
 * Compute summary analytics: totals, distributions, rates
 * @param {Array} userSeries - Array of UserSeries objects with included Series
 */
export function computeLibrarySummary(userSeries) {
    if (!userSeries || userSeries.length === 0) {
        return {
            totalTitles: 0,
            statusDistribution: {
                watching: 0,
                reading: 0,
                completed: 0,
                "on-hold": 0,
                dropped: 0,
                "plan-to-read": 0
            },
            typeDistribution: {
                anime: 0,
                manga: 0,
                manhwa: 0
            },
            completionRate: 0,
            dropRate: 0
        };
    }

    const totalTitles = userSeries.length;
    const statusDistribution = {
        watching: 0,
        reading: 0,
        completed: 0,
        "on-hold": 0,
        dropped: 0,
        "plan-to-read": 0
    };
    const typeDistribution = {
        anime: 0,
        manga: 0,
        manhwa: 0
    };

    let completedCount = 0;
    let droppedCount = 0;
    let startedCount = 0; // watching, reading, completed, on-hold, dropped (all except plan-to-read)

    userSeries.forEach(item => {
        // Status Counts
        const status = item.status || "plan-to-read";
        if (statusDistribution.hasOwnProperty(status)) {
            statusDistribution[status]++;
        } else {
            // Fallback for unknown statuses
            statusDistribution[status] = (statusDistribution[status] || 0) + 1;
        }

        // Type Counts
        const type = item.series?.type || "unknown";
        if (typeDistribution.hasOwnProperty(type)) {
            typeDistribution[type]++;
        }

        // Derived Counters
        if (status === "completed") completedCount++;
        if (status === "dropped") droppedCount++;
        if (status !== "plan-to-read") startedCount++;
    });

    // Rates
    // Completion rate = completed / total started (to avoid penalizing plan-to-read)
    // If started is 0, rate is 0.
    const completionRate = startedCount > 0
        ? Math.round((completedCount / startedCount) * 100) / 100 // 0.xx format
        : 0;

    // Drop rate = dropped / total (or total started? PRD says "dropped / total" but usually it's "total started") 
    // PRD: "dropped / total"
    const dropRate = totalTitles > 0
        ? Math.round((droppedCount / totalTitles) * 100) / 100
        : 0;

    return {
        totalTitles,
        statusDistribution,
        typeDistribution,
        completionRate,
        dropRate
    };
}

/**
 * Compute temporal activity signals
 * @param {Array} userSeries - Array of UserSeries objects
 */
export function computeActivitySignals(userSeries) {
    if (!userSeries || userSeries.length === 0) {
        return {
            lastInteractedAt: null,
            activeTitlesCount: 0,
            inactiveTitlesCount: 0,
            recentSeries: []
        };
    }

    const now = new Date();
    const thresholdTime = now.getTime() - (METRICS.INACTIVITY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

    // Sort by updatedAt descending
    const sorted = [...userSeries].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const lastInteractedAt = sorted[0]?.updatedAt || null;

    // Active = watching or reading
    const activeTitles = userSeries.filter(item =>
        item.status === 'watching' || item.status === 'reading'
    );

    const activeTitlesCount = activeTitles.length;

    // Inactive = Active status BUT not updated in X days
    const inactiveTitlesCount = activeTitles.filter(item => {
        const updatedTime = new Date(item.updatedAt).getTime();
        return updatedTime < thresholdTime;
    }).length;

    // Recent items (top 3)
    const recentSeries = sorted.slice(0, 3).map(item => ({
        id: item.series.id,
        title: item.series.title,
        status: item.status,
        updatedAt: item.updatedAt
    }));

    return {
        lastInteractedAt,
        activeTitlesCount,
        inactiveTitlesCount,
        recentSeries
    };
}

/**
 * Compute rating-based preference signals
 * @param {Array} userSeries - Array of UserSeries objects
 */
export function computeRatingSignals(userSeries) {
    if (!userSeries || userSeries.length === 0) {
        return {
            averageRating: 0,
            ratedCount: 0,
            ratingDistribution: {},
            topRatedTypes: []
        };
    }

    let totalRating = 0;
    let ratedCount = 0;
    const ratingDistribution = {
        "5": 0, "4": 0, "3": 0, "2": 0, "1": 0
    };

    // Type aggregates for "Strong Likes"
    const typeRatings = {
        anime: { sum: 0, count: 0 },
        manga: { sum: 0, count: 0 },
        manhwa: { sum: 0, count: 0 }
    };

    userSeries.forEach(item => {
        const rating = item.rating ? parseFloat(item.rating) : 0;
        if (rating > 0) {
            totalRating += rating;
            ratedCount++;

            // Distribution (Math.floor to group halves 4.5 -> 4)
            const bucket = Math.floor(rating).toString();
            if (ratingDistribution[bucket] !== undefined) {
                ratingDistribution[bucket]++;
            }

            // Type Aggregation
            const type = item.series?.type;
            if (type && typeRatings[type]) {
                typeRatings[type].sum += rating;
                typeRatings[type].count++;
            }
        }
    });

    const averageRating = ratedCount > 0
        ? Math.round((totalRating / ratedCount) * 10) / 10
        : 0;

    // Find top rated types (must have at least 2 ratings to be "significant")
    const topRatedTypes = Object.entries(typeRatings)
        .map(([type, data]) => ({
            type,
            avg: data.count > 0 ? data.sum / data.count : 0,
            count: data.count
        }))
        .filter(t => t.count >= 1) // Allow 1 for low data environments, ideally higher
        .sort((a, b) => b.avg - a.avg);

    return {
        averageRating,
        ratedCount,
        ratingDistribution,
        topRatedTypes
    };
}
