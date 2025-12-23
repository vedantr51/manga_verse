import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user-stats
 * Returns computed stats for the user's library (for future AI use).
 */
export async function GET() {
    if (!prisma) {
        return NextResponse.json(
            { error: "Database not configured" },
            { status: 503 }
        );
    }

    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Get all user series with status
        const userSeries = await prisma.userSeries.findMany({
            where: { userId },
            include: { series: true },
        });

        const totalSeries = userSeries.length;

        if (totalSeries === 0) {
            return NextResponse.json({
                totalSeries: 0,
                statusDistribution: {},
                typeDistribution: {},
                completionRate: 0,
                avgSeriesPerMonth: 0,
            });
        }

        // Status distribution
        const statusDistribution = {};
        userSeries.forEach((item) => {
            statusDistribution[item.status] = (statusDistribution[item.status] || 0) + 1;
        });

        // Type distribution (manga, anime, manhwa)
        const typeDistribution = {};
        userSeries.forEach((item) => {
            const type = item.series.type;
            typeDistribution[type] = (typeDistribution[type] || 0) + 1;
        });

        // Completion rate
        const completed = statusDistribution["completed"] || 0;
        const completionRate = Math.round((completed / totalSeries) * 100);

        // Monthly activity (how many series added per month on average)
        const dates = userSeries.map((item) => new Date(item.createdAt));
        const oldestDate = new Date(Math.min(...dates));
        const monthsActive = Math.max(1,
            Math.ceil((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
        );
        const avgSeriesPerMonth = Math.round((totalSeries / monthsActive) * 10) / 10;

        // Recent activity (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentlyUpdated = userSeries.filter(
            (item) => new Date(item.updatedAt) > thirtyDaysAgo
        ).length;

        return NextResponse.json({
            totalSeries,
            statusDistribution,
            typeDistribution,
            completionRate,
            avgSeriesPerMonth,
            recentlyUpdated,
            // For AI context
            readingPatterns: {
                primaryType: Object.entries(typeDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
                activeReader: recentlyUpdated >= 3,
                completionFocused: completionRate >= 50,
            },
        });
    } catch (error) {
        console.error("Error fetching user stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
