import { requireAdmin } from "@/app/utils/client";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "../../auth/utils";
import { pool, poolQuery } from "../../lib/db";
import { Role } from "@/types/role.types";

export async function GET(req: NextRequest) {
    const auth = await authenticateRequest();
    const checkAdmin = requireAdmin(auth);
    if (checkAdmin) return checkAdmin;
    
    let roles: Role[] = [];

    try {
        const result = await poolQuery(`SELECT * FROM master."SP_MASTER_ACCESS_LEVEL_GET"()`);

        roles = result.rows;

    } catch (dbError: any) {
        console.error("Error fetching roles from database:", dbError);
        return NextResponse.json(
            { message: "Failed to fetch roles from database", error: dbError.message },
            { status: 500 }
        );
    }

    return NextResponse.json({
        message: "All roles fetched successfully",
        status: 200,
        roles: roles 
    });
}

export async function POST(req: NextRequest) {
    const auth = await authenticateRequest();
    const checkAdmin = requireAdmin(auth);
    if (checkAdmin) return checkAdmin;
    
    let newRole: Role = await req.json();
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const result = await poolQuery(`SELECT * FROM master."SP_MASTER_ACCESS_LEVEL_INS"($1, $2)`, [JSON.stringify(newRole), auth.userId]);

        await client.query('COMMIT');

        return NextResponse.json(
            { message: "Role added successfully.", role: result.rows[0], status: 200 },
            { status: 200 }
        );

    } catch (dbError: any) {
        await client.query('ROLLBACK');
        console.error("Error adding new role to database:", dbError);
        return NextResponse.json(
            { message: "Failed to add role.", error: dbError.message },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}

export async function PUT(req: NextRequest) {
    const auth = await authenticateRequest();
    const checkAdmin = requireAdmin(auth);
    if (checkAdmin) return checkAdmin;

    let data: Partial<Role>;
    try {
        data = await req.json();
    } catch (error) {
        console.error("Invalid JSON in request body:", error);
        return NextResponse.json(
            { message: "Invalid request body. Expected JSON." },
            { status: 400 }
        );
    }

    if (typeof data.Role === 'undefined' || data.Role === null) {
        return NextResponse.json(
            { message: "Role is required in the request body for updating an role." },
            { status: 400 }
        );
    }

    const roleToUpdate = data.Role;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const result = await poolQuery(`SELECT * FROM master."SP_MASTER_ACCESS_LEVEL_UPD"($1, $2, $3)`, [roleToUpdate, JSON.stringify(data), auth.userId]);

        if (!result) {
            await client.query('ROLLBACK');
            return NextResponse.json(
                { message: `Role ${roleToUpdate} update failed.` },
                { status: 500 }
            );
        }

        await client.query('COMMIT');

        return NextResponse.json(
            { message: `Role ${roleToUpdate} updated successfully.`, role: result.rows[0], status: 200 }
        );

    } catch (dbError: any) {
        await client.query('ROLLBACK');
        console.error("Error updating address in database:", dbError);
        return NextResponse.json(
            { message: "Failed to update address.", error: dbError.message },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}

export async function DELETE(req: NextRequest) {
    const auth = await authenticateRequest();
    const checkAdmin = requireAdmin(auth);
    if (checkAdmin) return checkAdmin;

    const data = await req.json();

    if (!data) {
        return NextResponse.json(
            { message: "Role is required as a query parameter for deleting a role." },
            { status: 400 }
        );
    }

    try {
        const result = await poolQuery(`SELECT * FROM master."SP_MASTER_ACCESS_LEVEL_DEL"($1, $2)`, [data, auth.userId]);

        if (result.rowCount === 0) {
            return NextResponse.json(
                { message: `Role ${data} not found.`, status: 404 },
                { status: 404 }
            );
        }

        console.log(`Role ${data} deleted successfully.`);
        return NextResponse.json(
            { message: `Role ${data} deleted successfully.`, status: 200 },
            { status: 200 }
        );

    } catch (dbError: any) {
        console.error("Error deleting role from database:", dbError);
        return NextResponse.json(
            { message: "Failed to delete role.", error: dbError.message },
            { status: 500 }
        );
    }
}