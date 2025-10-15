import { checkRequire } from "@/app/utils/client";
import { NextRequest, NextResponse } from "next/server";
import { checkSystemAdminRequire } from "../../auth/utils";
import { addRole, deleteRole, getRoles, updateRule } from "../../services/admin/roleMgrService";
import { Role } from "@/types";

export async function GET(req: NextRequest) {
    // const auth = await checkSystemAdminRequire();
    // const isCheck = checkRequire(auth);
    // if (isCheck) return isCheck;
    
    const result = await getRoles();

    return NextResponse.json({
        message: "All roles fetched successfully",
        status: 200,
        roles: result 
    });
}

export async function POST(req: NextRequest) {
    const auth = await checkSystemAdminRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;
    
    let newRole: Role = await req.json();
    
    const result = await addRole(newRole, Number(auth.userId));

    return NextResponse.json(
        { message: "Role added successfully.", role: result, status: 200 },
        { status: 200 }
    );
}

export async function PUT(req: NextRequest) {
    const auth = await checkSystemAdminRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

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

    const result = await updateRule(roleToUpdate, data, Number(auth.userId));

    if (!result) {
        return NextResponse.json(
            { message: `Role ${roleToUpdate} update failed.` },
            { status: 500 }
        );
    }

    return NextResponse.json(
        { message: `Role ${roleToUpdate} updated successfully.`, role: result, status: 200 }
    );
}

export async function DELETE(req: NextRequest) {
    const auth = await checkSystemAdminRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const data = await req.json();

    if (!data) {
        return NextResponse.json(
            { message: "Role is required as a query parameter for deleting a role." },
            { status: 400 }
        );
    }

    try {
        const result = await deleteRole(data, Number(auth.userId));

        if (!result) {
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