import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeLibrarySummary } from "@/lib/insight-metrics";

export async function GET() {
    if (!prisma) {
        return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userSeries = await prisma.userSeries.findMany({
            where: { userId: session.user.id },
            select: { status: true } // Optimization: only select status
        });

        // Reuse logic but pass minimal object structure that matches what utility expects (it needs status)
        // utility expects userSeries array with item.status
        // array of { status: '...' } works perfectly.
        const { statusDistribution, totalTitles } = computeLibrarySummary(userSeries);

        return NextResponse.json({
            total: totalTitles,
            breakdown: statusDistribution
        });
    } catch (error) {
        console.error("Insights Status Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
