import { checkRequire } from "@/app/utils/client";
import { NextRequest, NextResponse } from "next/server";
import { checkSystemAdminRequire } from "../../auth/utils";
import { addAccess, deleteAccess, getAccesses, updateAccess } from "../../services/admin/accessMgrService";
import { AccessInfo } from "@/types";
import { logger } from "@/server/logger";

export async function GET() {
    // const auth = await checkSystemAdminRequire();
    // const isCheck = checkRequire(auth);
    // if (isCheck) return isCheck;
    
    const result = await getAccesses();

    return NextResponse.json({
        message: "All accesses fetched successfully",
        status: 200,
        accesses: result 
    });
}

export async function POST(req: NextRequest) {
    const auth = await checkSystemAdminRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    try {
        const newAccess: AccessInfo = await req.json();
    
        const result = await addAccess(newAccess, Number(auth.userId));

        return NextResponse.json(
            { message: "Access added successfully.", access: result, status: 200 },
            { status: 200 }
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        logger.error("Error adding access from database:", { error: error } );
        return NextResponse.json(
            { message: message, error: error },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    const auth = await checkSystemAdminRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    let data: AccessInfo;
    try {
        data = await req.json();
    } catch (error) {
        logger.error("Invalid JSON in request body:", { error: error });
        return NextResponse.json(
            { message: "Invalid request body. Expected JSON." },
            { status: 400 }
        );
    }

    if (typeof data.Level === 'undefined' || data.Level === null) {
        return NextResponse.json(
            { message: "Level is required in the request body for updating an access." },
            { status: 400 }
        );
    }

    const accessToUpdate = data.Level;

    const result = await updateAccess(accessToUpdate, data, Number(auth.userId));

    if (!result) {
        return NextResponse.json(
            { message: `Access ${accessToUpdate} update failed.` },
            { status: 500 }
        );
    }

    return NextResponse.json(
        { message: `Access ${accessToUpdate} updated successfully.`, access: result, status: 200 }
    );
}

export async function DELETE(req: NextRequest) {
    const auth = await checkSystemAdminRequire();
    const isCheck = checkRequire(auth);
    if (isCheck) return isCheck;

    const data = await req.json();

    if (!data) {
        return NextResponse.json(
            { message: "Level is required as a query parameter for deleting a access." },
            { status: 400 }
        );
    }

    try {
        const result = await deleteAccess(data, Number(auth.userId));

        if (!result) {
            return NextResponse.json(
                { message: `Access ${data} not found.`, status: 404 },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { message: `Access ${data} deleted successfully.`, status: 200 },
            { status: 200 }
        );

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        logger.error("Error deleting access from database:", { error: error } );
        return NextResponse.json(
            { message: message, error: error },
            { status: 500 }
        );
    }
}