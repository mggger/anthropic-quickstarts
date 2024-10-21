// @ts-nocheck

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from '@cloudflare/next-on-pages';
export const runtime = 'edge';

const handleError = (error: unknown) => {
    console.error("API Error:", error);
    if (error instanceof Error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
    return NextResponse.json(
        { error: "An unexpected error occurred" },
        { status: 500 }
    );
};

// POST: Send database configuration to Python backend and retrieve tables
export async function POST(req: NextRequest) {
    try {

        const ctx = getRequestContext();
        const backend_endpoint = ctx.env.BACKEND_API_URL;
        const body = await req.json();
        const { host, port, database, username, password } = body;

        // Input validation
        if (!host || !port || !database || !username || !password) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        // Call the Python backend
        const response = await fetch(`${backend_endpoint}/pg_config_load`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ host, port, database, username, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                { error: errorData.detail || "Error connecting to database" },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json({
            message: "Connection successful",
            tables: data.tables
        });
    } catch (error) {
        return handleError(error);
    }
}