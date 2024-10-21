import { NextRequest, NextResponse } from "next/server";
import { D1Database } from "@cloudflare/workers-types";
import { getRequestContext } from '@cloudflare/next-on-pages';

interface Env {
    DB: D1Database;
}

export const runtime = 'edge';

const handleError = (error: unknown) => {
    console.error("API Error:", error);
    return NextResponse.json(
        { error: "An unexpected error occurred" },
        { status: 500 }
    );
};

// GET: Fetch all configured data sources
export async function GET(req: NextRequest) {
    const { env } = getRequestContext();
    try {
        const { results } = await env.DB.prepare(`
            SELECT ds.id, ds.name, ds.host, ds.port, ds.database, ds.username, ds.password,
                   GROUP_CONCAT(t.name) as tables
            FROM data_sources ds
            LEFT JOIN tables t ON ds.id = t.data_source_id
            GROUP BY ds.id
        `).all();

        const formattedResults = results.map(result => ({
            ...result,
            tables: result.tables ? result.tables.split(',') : []
        }));

        return NextResponse.json(formattedResults);
    } catch (error) {
        return handleError(error);
    }
}

// POST: Create a new data source configuration
export async function POST(req: NextRequest) {
    const { env } = getRequestContext();
    try {
        const body = await req.json();
        const { name, host, port, database, username, password, tables } = body;

        if (!name || !host || !port || !database || !username || !password) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            );
        }

        const result = await env.DB.prepare(`
            INSERT INTO data_sources (name, host, port, database, username, password)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(name, host, port, database, username, password).run();

        if (result.success && tables && tables.length > 0) {
            const dataSourceId = result.meta.last_row_id;
            for (const table of tables) {
                await env.DB.prepare(
                    "INSERT INTO tables (name, data_source_id) VALUES (?, ?)"
                ).bind(table, dataSourceId).run();
            }
        }

        return NextResponse.json(
            { message: "Data source created successfully", id: result.meta.last_row_id },
            { status: 201 }
        );
    } catch (error) {
        return handleError(error);
    }
}

// PUT: Update an existing data source configuration
export async function PUT(req: NextRequest) {
    const { env } = getRequestContext();
    try {
        const body = await req.json();
        const { id, name, host, port, database, username, password, tables } = body;

        console.log(id, name, host, port, database, username, password, tables);

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await env.DB.prepare(`
            UPDATE data_sources 
            SET name = ?, host = ?, port = ?, database = ?, username = ?, password = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(name, host, port, database, username, password, id).run();

        // Delete existing tables
        await env.DB.prepare("DELETE FROM tables WHERE data_source_id = ?")
            .bind(id)
            .run();

        // Insert new tables
        if (tables && tables.length > 0) {
            for (const table of tables) {
                await env.DB.prepare(
                    "INSERT INTO tables (name, data_source_id) VALUES (?, ?)"
                ).bind(table, id).run();
            }
        }

        return NextResponse.json({
            message: "Data source updated successfully",
            id: id,
        });
    } catch (error) {
        return handleError(error);
    }
}

// DELETE: Remove a data source configuration
export async function DELETE(req: NextRequest) {
    const { env } = getRequestContext();
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        // Delete associated tables first
        await env.DB.prepare("DELETE FROM tables WHERE data_source_id = ?")
            .bind(id)
            .run();

        // Then delete the data source
        await env.DB.prepare("DELETE FROM data_sources WHERE id = ?")
            .bind(id)
            .run();

        return NextResponse.json({ message: "Data source deleted successfully" });
    } catch (error) {
        return handleError(error);
    }
}