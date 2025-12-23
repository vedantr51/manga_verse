import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/sync
 * Syncs local data with cloud, using timestamps for conflict resolution.
 * 
 * Body: { items: [...], lastSyncedAt?: timestamp }
 * Response: { merged: [...], syncedAt: timestamp }
 */
export async function POST(request) {
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
        const { items = [], lastSyncedAt } = await request.json();

        // Fetch all cloud data for this user
        const cloudData = await prisma.userSeries.findMany({
            where: { userId },
            include: { series: true },
        });

        const cloudMap = new Map();
        cloudData.forEach((item) => {
            const key = `${item.series.title}::${item.series.type}`;
            cloudMap.set(key, item);
        });

        const merged = [];
        const processedKeys = new Set();

        // Process local items
        for (const localItem of items) {
            const key = `${localItem.title}::${localItem.type}`;
            processedKeys.add(key);

            const cloudItem = cloudMap.get(key);
            const localUpdatedAt = localItem.updatedAt ? new Date(localItem.updatedAt) : new Date(0);

            if (!cloudItem) {
                // New item - create in cloud
                const created = await upsertUserSeries(userId, localItem);
                merged.push({ ...created, syncAction: "created" });
            } else {
                const cloudUpdatedAt = new Date(cloudItem.updatedAt);

                if (localUpdatedAt > cloudUpdatedAt) {
                    // Local is newer - update cloud
                    const updated = await upsertUserSeries(userId, localItem);
                    merged.push({ ...updated, syncAction: "updated_from_local" });
                } else {
                    // Cloud is newer or same - keep cloud
                    merged.push({
                        id: cloudItem.id,
                        title: cloudItem.series.title,
                        type: cloudItem.series.type,
                        status: cloudItem.status,
                        lastProgress: cloudItem.lastProgress,
                        notes: cloudItem.notes,
                        thumbnailUrl: cloudItem.series.thumbnailUrl,
                        externalId: cloudItem.series.externalId,
                        alternateTitles: cloudItem.series.alternateTitles,
                        createdAt: cloudItem.createdAt,
                        updatedAt: cloudItem.updatedAt,
                        syncAction: "kept_cloud",
                    });
                }
            }
        }

        // Add cloud-only items (not in local)
        for (const [key, cloudItem] of cloudMap) {
            if (!processedKeys.has(key)) {
                merged.push({
                    id: cloudItem.id,
                    title: cloudItem.series.title,
                    type: cloudItem.series.type,
                    status: cloudItem.status,
                    lastProgress: cloudItem.lastProgress,
                    notes: cloudItem.notes,
                    thumbnailUrl: cloudItem.series.thumbnailUrl,
                    externalId: cloudItem.series.externalId,
                    alternateTitles: cloudItem.series.alternateTitles,
                    createdAt: cloudItem.createdAt,
                    updatedAt: cloudItem.updatedAt,
                    syncAction: "cloud_only",
                });
            }
        }

        return NextResponse.json({
            merged,
            syncedAt: new Date().toISOString(),
            itemCount: merged.length,
        });
    } catch (error) {
        console.error("Sync error:", error);
        return NextResponse.json(
            { error: "Sync failed" },
            { status: 500 }
        );
    }
}

// Helper: Upsert a series for a user
async function upsertUserSeries(userId, data) {
    const { title, type, status, lastProgress, notes, externalId, thumbnailUrl, alternateTitles } = data;

    // Find or create the series
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
        // Upgrade legacy series with canonical data if matched
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
        thumbnailUrl: userSeries.series.thumbnailUrl,
        externalId: userSeries.series.externalId,
        alternateTitles: userSeries.series.alternateTitles,
        createdAt: userSeries.createdAt,
        updatedAt: userSeries.updatedAt,
    };
}
