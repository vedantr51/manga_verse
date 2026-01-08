import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request) {
    // Check if database is configured
    if (!prisma) {
        return NextResponse.json(
            { error: "Database not configured" },
            { status: 503 }
        );
    }

    try {
        const { username, password, name } = await request.json();

        // Validate input
        if (!username || !password) {
            return NextResponse.json(
                { error: "Username and password are required" },
                { status: 400 }
            );
        }

        if (username.length < 3) {
            return NextResponse.json(
                { error: "Username must be at least 3 characters" },
                { status: 400 }
            );
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return NextResponse.json(
                { error: "Username can only contain letters, numbers, and underscores" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Check if username already exists
        const existingUser = await prisma.user.findUnique({
            where: { username },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Username already taken" },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                name: name || username,
            },
        });

        return NextResponse.json(
            {
                message: "User created successfully",
                user: {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
