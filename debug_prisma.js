
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting Prisma Debug...");
    try {
        // 1. Fetch a user
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("No users found. Cannot test.");
            return;
        }
        console.log("Found user:", user.id);

        // 2. Create/Find a series
        const series = await prisma.series.upsert({
            where: {
                externalId_type: { externalId: "99999-debug", type: "manga" }
            },
            create: {
                title: "Debug Series",
                type: "manga",
                externalId: "99999-debug"
            },
            update: {}
        });
        console.log("Found/Created series:", series.id);

        // 3. Upsert UserSeries with ratingLabel
        console.log("Attempting to upsert UserSeries with ratingLabel...");
        const userSeries = await prisma.userSeries.upsert({
            where: {
                userId_seriesId: { userId: user.id, seriesId: series.id }
            },
            create: {
                userId: user.id,
                seriesId: series.id,
                status: "reading",
                rating: 5,
                ratingLabel: "Debug Arc"
            },
            update: {
                ratingLabel: "Debug Arc Updated"
            }
        });
        console.log("Success! UserSeries:", userSeries);

    } catch (e) {
        console.error("Prisma Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
