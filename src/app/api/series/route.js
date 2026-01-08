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
            thumbnailUrl: us.series.thumbnailUrl,
            externalId: us.series.externalId,
            alternateTitles: us.series.alternateTitles,
            createdAt: us.createdAt,
            updatedAt: us.updatedAt,
            rating: us.rating,
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

        // Check for duplicates before adding single series
        const { title, type, externalId } = body;

        // First check if user already has this series
        let existingSeries = null;

        if (externalId) {
            // Check by externalId first (most reliable)
            const series = await prisma.series.findUnique({
                where: { externalId_type: { externalId, type } },
                include: {
                    users: {
                        where: { userId: session.user.id }
                    }
                }
            });
            if (series?.users?.length > 0) {
                existingSeries = series;
            }
        }

        if (!existingSeries && title) {
            // Fallback: check by title (for manual entries or legacy data)
            const series = await prisma.series.findFirst({
                where: { title, type },
                include: {
                    users: {
                        where: { userId: session.user.id }
                    }
                }
            });
            if (series?.users?.length > 0) {
                existingSeries = series;
            }
        }

        // If duplicate found, return 409 Conflict
        if (existingSeries) {
            return NextResponse.json(
                {
                    error: "DUPLICATE_SERIES",
                    message: `${title} is already in your library`,
                    existingId: existingSeries.users[0].id
                },
                { status: 409 }
            );
        }

        // Handle single series add (no duplicate)
        const result = await upsertUserSeries(session.user.id, body);
        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error adding series:", error);
        console.error("Error stack:", error.stack);
        console.error("Error message:", error.message);
        return NextResponse.json(
            { error: "Failed to add series", details: error.message },
            { status: 500 }
        );
    }
}

// Helper: Upsert a series for a user
async function upsertUserSeries(userId, data) {
    console.log("upsertUserSeries called with userId:", userId, "data:", JSON.stringify(data));
    const { title, type, status, lastProgress, notes, externalId, thumbnailUrl, alternateTitles, rating } = data;

    // Find or create the series
    // Logic: 
    // 1. If externalId is provided, try to find by externalId + type
    // 2. If not found or no externalId, try to find by title + type (legacy/manual fallback)
    // 3. Create if doesn't exist

    let series = null;

    if (externalId) {
        series = await prisma.series.findUnique({
            where: { externalId_type: { externalId, type } },
        });
    }

    if (!series) {
        series = await prisma.series.findFirst({
            where: { title, type }, // Fallback for legacy data or manual entry
        });
    }

    if (!series) {
        series = await prisma.series.create({
            data: {
                title,
                type,
                externalId,
                thumbnailUrl,
                alternateTitles: alternateTitles || []
            },
        });
    } else if (externalId && !series.externalId) {
        // If we found an existing manual entry but now have an externalId, update it
        // This effectively "upgrades" legacy data to canonical data
        await prisma.series.update({
            where: { id: series.id },
            data: {
                externalId,
                thumbnailUrl: thumbnailUrl || series.thumbnailUrl,
                alternateTitles: alternateTitles || series.alternateTitles
            }
        });
    }

    // Upsert the user-series relationship
    const updateData = {
        status,
        lastProgress,
        notes,
        updatedAt: new Date(),
    };

    // Only include rating fields if rating is provided
    if (rating !== undefined && rating !== null && rating > 0) {
        updateData.rating = parseFloat(rating);
        updateData.ratedAt = new Date();
    }

    const userSeries = await prisma.userSeries.upsert({
        where: {
            userId_seriesId: { userId, seriesId: series.id },
        },
        update: updateData,
        create: {
            userId,
            seriesId: series.id,
            status,
            lastProgress,
            notes,
            rating: rating ? parseFloat(rating) : 0,
            ratedAt: rating ? new Date() : null,
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
        // Return canonical data for UI
        thumbnailUrl: userSeries.series.thumbnailUrl,
        externalId: userSeries.series.externalId,
        alternateTitles: userSeries.series.alternateTitles,
        createdAt: userSeries.createdAt,
        updatedAt: userSeries.updatedAt,
        rating: userSeries.rating,
    };
}
