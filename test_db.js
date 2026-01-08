
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Testing Prisma connection...');
    try {
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log('No users found, cannot test upsertUserSeries effectively without a user.');
            // Create a dummy user if needed, or just specific userId if known.
            // Assuming 'vedant' exists or similar.
        } else {
            console.log('Found user:', user.id);
            const userId = user.id;

            console.log('Attempting to create/upsert UserSeries with ratingLabel...');

            // Mock series creation
            const seriesData = {
                title: "Test Series Haikyuu",
                type: "anime",
                externalId: null,
                thumbnailUrl: null,
                alternateTitles: []
            };

            let series = await prisma.series.findFirst({
                where: { title: seriesData.title, type: seriesData.type }
            });

            if (!series) {
                series = await prisma.series.create({ data: seriesData });
                console.log('Created series:', series.id);
            } else {
                console.log('Found series:', series.id);
            }

            // Test Upsert with ratingLabel
            try {
                const userSeries = await prisma.userSeries.upsert({
                    where: {
                        userId_seriesId: { userId, seriesId: series.id },
                    },
                    update: {
                        status: "watching",
                        ratingLabel: "Peak Arc", // <--- The field in question
                        rating: 4.0
                    },
                    create: {
                        userId,
                        seriesId: series.id,
                        status: "watching",
                        ratingLabel: "Peak Arc",
                        rating: 4.0
                    },
                });
                console.log('Upsert successful:', userSeries);
            } catch (e) {
                console.error('Upsert FAILED:', e);
            }
        }

    } catch (e) {
        console.error('Prisma error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
