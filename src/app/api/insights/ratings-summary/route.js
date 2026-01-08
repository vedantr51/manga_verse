import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeRatingSignals } from "@/lib/insight-metrics";

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
            select: {
                rating: true,
                series: {
                    select: { type: true }
                }
            }
        });

        const signals = computeRatingSignals(userSeries);

        return NextResponse.json(signals);
    } catch (error) {
        console.error("Insights Ratings Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
