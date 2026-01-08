import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeActivitySignals } from "@/lib/insight-metrics";

export async function GET() {
    if (!prisma) {
        return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // We fetch all again - optimization: could strictly fetch just needed fields, 
        // but for <1000 items, fetching all is negligible and easier for code reuse.
        // If optimizing, we would select only: id, status, updatedAt, series:{id, title}
        const userSeries = await prisma.userSeries.findMany({
            where: { userId: session.user.id },
            select: {
                id: true,
                status: true,
                updatedAt: true,
                series: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        const activity = computeActivitySignals(userSeries);

        return NextResponse.json(activity);
    } catch (error) {
        console.error("Insights Activity Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
