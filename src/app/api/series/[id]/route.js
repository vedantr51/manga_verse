import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/series/[id] - Update series progress/status
export async function PUT(request, { params }) {
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

        const { id } = await params;
        const updates = await request.json();

        // Verify ownership
        const existing = await prisma.userSeries.findFirst({
            where: { id, userId: session.user.id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Series not found" }, { status: 404 });
        }

        // Update allowed fields only
        const { status, lastProgress, notes } = updates;
        const userSeries = await prisma.userSeries.update({
            where: { id },
            data: {
                ...(status !== undefined && { status }),
                ...(lastProgress !== undefined && { lastProgress }),
                ...(notes !== undefined && { notes }),
                updatedAt: new Date(),
            },
            include: { series: true },
        });

        return NextResponse.json({
            id: userSeries.id,
            title: userSeries.series.title,
            type: userSeries.series.type,
            status: userSeries.status,
            lastProgress: userSeries.lastProgress,
            notes: userSeries.notes,
            createdAt: userSeries.createdAt,
            updatedAt: userSeries.updatedAt,
        });
    } catch (error) {
        console.error("Error updating series:", error);
        return NextResponse.json(
            { error: "Failed to update series" },
            { status: 500 }
        );
    }
}

// DELETE /api/series/[id] - Remove series from library
export async function DELETE(request, { params }) {
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

        const { id } = await params;

        // Verify ownership before delete
        const existing = await prisma.userSeries.findFirst({
            where: { id, userId: session.user.id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Series not found" }, { status: 404 });
        }

        await prisma.userSeries.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting series:", error);
        return NextResponse.json(
            { error: "Failed to delete series" },
            { status: 500 }
        );
    }
}
