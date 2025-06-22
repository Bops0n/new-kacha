// app/api/categories/route.ts

import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth'; // Optional: for authorization
// import { authOptions } from '../../auth/[...nextauth]/route'; // Optional: for authorization
import { poolQuery } from '../../lib/db'; // Adjust path if needed

// Define interface for Category, matching your assumed database schema for Category
interface Category {
    Category_ID: number;
    Name: string;
}

// --- GET All Categories or by ID ---
export async function GET(req: NextRequest) {
    // Optional: Authorization check
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }

    const categoryId = req.nextUrl.searchParams.get('id');

    let categories: Category[] = [];
    let sql: string;
    let queryParams: (string | number)[] = [];

    const selectColumns = `"Category_ID", "Name"`;

    if (categoryId) {
        sql = `SELECT ${selectColumns} FROM public."Category" WHERE "Category_ID" = $1`;
        queryParams.push(parseInt(categoryId, 10));
    } else {
        sql = `SELECT ${selectColumns} FROM public."Category" ORDER BY "Category_ID" ASC`;
    }

    try {
        const result = await poolQuery(sql, queryParams);
        categories = result.rows;
        if (categoryId && categories.length === 0) {
            return NextResponse.json({ message: 'Category not found' }, { status: 404 });
        }
        return NextResponse.json({ categories }, { status: 200 });
    } catch (dbError: any) {
        console.error("Error fetching categories:", dbError);
        return NextResponse.json({ message: "Failed to fetch categories", error: dbError.message }, { status: 500 });
    }
}

// --- POST Add New Category ---
export async function POST(req: NextRequest) {
    // Optional: Authorization check
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }

    let newCategoryData: Omit<Category, 'Category_ID'>;
    try {
        newCategoryData = await req.json();
    } catch (error) {
        console.error("Invalid JSON in request body:", error);
        return NextResponse.json({ message: "Invalid JSON in request body." }, { status: 400 });
    }

    // Basic validation for required fields
    if (!newCategoryData.Name || newCategoryData.Name.trim() === '') {
        return NextResponse.json({ message: `"Name" is required to add a category.` }, { status: 400 });
    }

    const sql = `
        INSERT INTO public."Category" (
            "Name"
        ) VALUES (
            $1
        )
        RETURNING "Category_ID";
    `;
    const queryParams = [
        newCategoryData.Name.trim()
    ];

    try {
        const result = await poolQuery(sql, queryParams);
        const newCategoryId = result.rows[0].Category_ID;
        return NextResponse.json({ message: "Category added successfully.", Category_ID: newCategoryId }, { status: 201 });
    } catch (dbError: any) {
        console.error("Error adding category:", dbError);
        // Handle specific error for duplicate names if your DB has a unique constraint
        if (dbError.code === '23505') { // PostgreSQL unique violation error code
            return NextResponse.json({ message: "Category with this name already exists.", error: dbError.message }, { status: 409 });
        }
        return NextResponse.json({ message: "Failed to add category.", error: dbError.message }, { status: 500 });
    }
}

// --- PATCH Update Category ---
export async function PATCH(req: NextRequest) {
    // Optional: Authorization check
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }

    let updatedCategoryData: Partial<Category>;
    try {
        updatedCategoryData = await req.json();
    } catch (error) {
        console.error("Invalid JSON in request body:", error);
        return NextResponse.json({ message: "Invalid JSON in request body." }, { status: 400 });
    }

    if (typeof updatedCategoryData.Category_ID === 'undefined' || updatedCategoryData.Category_ID === null) {
        return NextResponse.json({ message: "Category_ID is required for update." }, { status: 400 });
    }

    const categoryIdToUpdate = updatedCategoryData.Category_ID;
    const updateColumns: string[] = [];
    const queryParams: (string | number)[] = [];
    let paramIndex = 1;

    const excludedFields = ['Category_ID'];

    // Only allow updating 'Name' for now
    if (updatedCategoryData.Name !== undefined) {
        if (updatedCategoryData.Name.trim() === '') {
            return NextResponse.json({ message: `"Name" cannot be empty.` }, { status: 400 });
        }
        updateColumns.push(`"Name" = $${paramIndex}`);
        queryParams.push(updatedCategoryData.Name.trim());
        paramIndex++;
    }

    if (updateColumns.length === 0) {
        return NextResponse.json({ message: "No valid fields provided for update." }, { status: 400 });
    }

    queryParams.push(categoryIdToUpdate); // Add Category_ID for the WHERE clause
    const sql = `
        UPDATE public."Category"
        SET ${updateColumns.join(', ')}
        WHERE "Category_ID" = $${paramIndex};
    `;

    try {
        const result = await poolQuery(sql, queryParams);
        if (result.rowCount === 0) {
            return NextResponse.json({ message: `Category with ID ${categoryIdToUpdate} not found.` }, { status: 404 });
        }
        return NextResponse.json({ message: `Category ID ${categoryIdToUpdate} updated successfully.` }, { status: 200 });
    } catch (dbError: any) {
        console.error("Error updating category:", dbError);
        if (dbError.code === '23505') { // PostgreSQL unique violation error code
            return NextResponse.json({ message: "Category with this name already exists.", error: dbError.message }, { status: 409 });
        }
        return NextResponse.json({ message: "Failed to update category.", error: dbError.message }, { status: 500 });
    }
}

// --- DELETE Category ---
export async function DELETE(req: NextRequest) {
    // Optional: Authorization check
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }

    const categoryIdToDelete = req.nextUrl.searchParams.get('id');

    if (!categoryIdToDelete) {
        return NextResponse.json({ message: "Category ID is required as a query parameter for deleting a category." }, { status: 400 });
    }

    const parsedCategoryId = parseInt(categoryIdToDelete, 10);
    if (isNaN(parsedCategoryId)) {
        return NextResponse.json({ message: "Invalid Category ID provided. Must be a number." }, { status: 400 });
    }

    // --- IMPORTANT: Check for Foreign Key Dependencies ---
    // Before deleting a main category, check if any sub-categories are linked to it.
    // If so, deletion should be prevented or handled (e.g., set sub-category's parent_id to null, or delete cascade - but RESTRICT is safer)
    try {
        const checkSql = `SELECT COUNT(*) FROM public."Sub_Category" WHERE "Category_ID" = $1;`;
        const checkResult = await poolQuery(checkSql, [parsedCategoryId]);
        if (checkResult.rows[0].count > 0) {
            return NextResponse.json({ message: "Cannot delete category: Sub-categories are linked to it. Please delete linked sub-categories first." }, { status: 409 });
        }

        // Also check if any products are directly linked to this Category (though typically products link to Child_Sub_Category)
        // This part might not be strictly necessary if your product only links to child_id
        // const checkProductSql = `SELECT COUNT(*) FROM public."Product" WHERE "Category_ID" = $1;`; // Assuming direct link for example
        // const checkProductResult = await poolQuery(checkProductSql, [parsedCategoryId]);
        // if (checkProductResult.rows[0].count > 0) {
        //     return NextResponse.json({ message: "Cannot delete category: Products are linked to it. Please reassign or delete linked products first." }, { status: 409 });
        // }

    } catch (checkError: any) {
        console.error("Error checking category dependencies:", checkError);
        return NextResponse.json({ message: "Failed to check category dependencies.", error: checkError.message }, { status: 500 });
    }

    const deleteSql = `DELETE FROM public."Category" WHERE "Category_ID" = $1;`;

    try {
        const result = await poolQuery(deleteSql, [parsedCategoryId]);
        if (result.rowCount === 0) {
            return NextResponse.json({ message: `Category with ID ${parsedCategoryId} not found.` }, { status: 404 });
        }
        return NextResponse.json({ message: `Category ID ${parsedCategoryId} deleted successfully.` }, { status: 200 });
    } catch (dbError: any) {
        console.error("Error deleting category:", dbError);
        return NextResponse.json({ message: "Failed to delete category.", error: dbError.message }, { status: 500 });
    }
}
