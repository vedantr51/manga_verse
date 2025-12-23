import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/series - Fetch user's series
export async function GET() {
    // Check if database is configured
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

        const userSeries = await prisma.userSeries.findMany({
            where: { userId: session.user.id },
            include: { series: true },
            orderBy: { updatedAt: "desc" },
        });

        // Transform to match existing frontend format
        const formatted = userSeries.map((us) => ({
            id: us.id,
            title: us.series.title,
            type: us.series.type,
            status: us.status,
            lastProgress: us.lastProgress,
            notes: us.notes,
            createdAt: us.createdAt,
            updatedAt: us.updatedAt,
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error fetching series:", error);
        return NextResponse.json(
            { error: "Failed to fetch series" },
            { status: 500 }
        );
    }
}

// POST /api/series - Add new series or sync from localStorage
export async function POST(request) {
    // Check if database is configured
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

        const body = await request.json();

        // Handle bulk sync (array of series from localStorage)
        if (Array.isArray(body)) {
            const results = await Promise.all(
                body.map((item) => upsertUserSeries(session.user.id, item))
            );
            return NextResponse.json({ synced: results.length });
        }

        // Handle single series add
        const result = await upsertUserSeries(session.user.id, body);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error adding series:", error);
        return NextResponse.json(
            { error: "Failed to add series" },
            { status: 500 }
        );
    }
}

// Helper: Upsert a series for a user
async function upsertUserSeries(userId, data) {
    const { title, type, status, lastProgress, notes } = data;

    // Find or create the series
    let series = await prisma.series.findUnique({
        where: { title_type: { title, type } },
    });

    if (!series) {
        series = await prisma.series.create({
            data: { title, type },
        });
    }

    // Upsert the user-series relationship
    const userSeries = await prisma.userSeries.upsert({
        where: {
            userId_seriesId: { userId, seriesId: series.id },
        },
        update: {
            status,
            lastProgress,
            notes,
            updatedAt: new Date(),
        },
        create: {
            userId,
            seriesId: series.id,
            status,
            lastProgress,
            notes,
        },
        include: { series: true },
    });

    return {
        id: userSeries.id,
        title: userSeries.series.title,
        type: userSeries.series.type,
        status: userSeries.status,
        lastProgress: userSeries.lastProgress,
        notes: userSeries.notes,
        createdAt: userSeries.createdAt,
        updatedAt: userSeries.updatedAt,
    };
}
