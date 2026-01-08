import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateContinueRecommendations } from "@/lib/recommendation-engine";

/**
 * GET /api/recommendations/continue
 * Returns series the user is currently watching/reading
 * Sorted by most recent activity
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

        // Fetch user's active series (watching or reading)
        const userSeries = await prisma.userSeries.findMany({
            where: {
                userId: session.user.id,
                status: {
                    in: ['watching', 'reading']
                }
            },
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
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Generate recommendations using engine
        const recommendations = generateContinueRecommendations(userSeries);

        return NextResponse.json({
            recommendations,
            count: recommendations.length
        });
    } catch (error) {
        console.error("Continue Recommendations Error:", error);
        return NextResponse.json(
            { error: "Failed to generate recommendations" },
            { status: 500 }
        );
    }
}
