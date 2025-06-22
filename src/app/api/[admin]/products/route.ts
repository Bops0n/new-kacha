// app/api/products/route.ts

import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth'; // Optional: for authorization
// import { authOptions } from '../../auth/[...nextauth]/route'; // Optional: for authorization
import { poolQuery } from '../../lib/db'; // Adjust path if needed

// Define Product interface, matching the client-side ProductInventory
interface Product {
    Product_ID: number;
    Child_ID: number | null;
    Name: string;
    Brand: string | null; // Changed to null as per schema
    Description: string | null;
    Unit: string;
    Quantity: number;
    Sale_Cost: number;
    Sale_Price: number;
    Reorder_Point: number;
    Visibility: boolean;
    Review_Rating: number | null;
    Image_URL: string | null;
    Dimensions: string | null; // NEW: Added Dimensions
    Material: string | null;   // NEW: Added Material
}

// --- GET All Products or by ID ---
export async function GET(req: NextRequest) {
    // Optional: Authorization check
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }

    const productId = req.nextUrl.searchParams.get('id');

    let products: Product[] = [];
    let sql: string;
    let queryParams: (string | number)[] = [];

    // Ensure column names match your DB schema (PascalCase)
    const selectColumns = `
        "Product_ID", "Child_ID", "Name", "Brand", "Description", "Unit",
        "Quantity", "Sale_Cost", "Sale_Price", "Reorder_Point", "Visibility",
        "Review_Rating", "Image_URL", "Dimensions", "Material"
    `;

    if (productId) {
        sql = `SELECT ${selectColumns} FROM public."Product" WHERE "Product_ID" = $1`; // Assuming table name is "Product"
        queryParams.push(parseInt(productId, 10));
    } else {
        sql = `SELECT ${selectColumns} FROM public."Product" ORDER BY "Product_ID" ASC`; // Assuming table name is "Product"
    }

    try {
        const result = await poolQuery(sql, queryParams);
        products = result.rows;
        if (productId && products.length === 0) {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }
        return NextResponse.json({ products }, { status: 200 });
    } catch (dbError: any) {
        console.error("Error fetching products:", dbError);
        return NextResponse.json({ message: "Failed to fetch products", error: dbError.message }, { status: 500 });
    }
}

// --- POST Add New Product ---
export async function POST(req: NextRequest) {
    // Optional: Authorization check
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }

    let newProductData: Omit<Product, 'Product_ID'>;
    try {
        newProductData = await req.json();
    } catch (error) {
        console.error("Invalid JSON in request body:", error);
        return NextResponse.json({ message: "Invalid JSON in request body." }, { status: 400 });
    }

    // Basic validation for required fields based on schema's NOT NULL constraints
    // Schema shows "Child_ID", "Name", "Unit", "Quantity", "Sale_Cost", "Sale_Price", "Reorder_Point" as NOT NULL
    const requiredFields = [
        'Child_ID', 'Name', 'Unit', 'Quantity', 'Sale_Cost', 'Sale_Price', 'Reorder_Point'
    ];
    
    for (const field of requiredFields) {
        // Check for undefined, null, or empty string (for string fields)
        if (typeof (newProductData as any)[field] === 'undefined' || (newProductData as any)[field] === null || (typeof (newProductData as any)[field] === 'string' && (newProductData as any)[field].trim() === '')) {
            return NextResponse.json({ message: `"${field}" is required to add a product.` }, { status: 400 });
        }
    }

    // Specific validation for numeric fields
    if (newProductData.Quantity < 0) {
        return NextResponse.json({ message: `"Quantity" cannot be negative.` }, { status: 400 });
    }
    if (newProductData.Sale_Cost < 0) {
        return NextResponse.json({ message: `"Sale_Cost" cannot be negative.` }, { status: 400 });
    }
    if (newProductData.Sale_Price <= 0) {
        return NextResponse.json({ message: `"Sale_Price" must be greater than 0.` }, { status: 400 });
    }
    if (newProductData.Reorder_Point < 0) {
        return NextResponse.json({ message: `"Reorder_Point" cannot be negative.` }, { status: 400 });
    }
    if (newProductData.Review_Rating !== null && (newProductData.Review_Rating < 0 || newProductData.Review_Rating > 5)) {
        return NextResponse.json({ message: `"Review_Rating" must be between 0 and 5, or null.` }, { status: 400 });
    }


    const sql = `
        INSERT INTO public."Product" (
            "Child_ID", "Name", "Brand", "Description", "Unit",
            "Quantity", "Sale_Cost", "Sale_Price", "Reorder_Point", "Visibility",
            "Review_Rating", "Image_URL", "Dimensions", "Material"
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        )
        RETURNING "Product_ID";
    `;
    const queryParams = [
        newProductData.Child_ID,
        newProductData.Name,
        newProductData.Brand ?? null, // Handle optional nullable fields
        newProductData.Description ?? null, // Handle optional nullable fields
        newProductData.Unit,
        newProductData.Quantity,
        newProductData.Sale_Cost,
        newProductData.Sale_Price,
        newProductData.Reorder_Point,
        newProductData.Visibility,
        newProductData.Review_Rating ?? null, // Handle optional nullable fields
        newProductData.Image_URL ?? null, // Handle optional nullable fields
        newProductData.Dimensions ?? null, // NEW: Include Dimensions
        newProductData.Material ?? null,   // NEW: Include Material
    ];

    try {
        const result = await poolQuery(sql, queryParams);
        const newProductId = result.rows[0].Product_ID;
        return NextResponse.json({ message: "Product added successfully.", Product_ID: newProductId }, { status: 201 });
    } catch (dbError: any) {
        console.error("Error adding product:", dbError);
        // Add more specific error handling for unique constraints, etc., if applicable
        return NextResponse.json({ message: "Failed to add product.", error: dbError.message }, { status: 500 });
    }
}

// --- PATCH Update Product ---
export async function PATCH(req: NextRequest) {
    // Optional: Authorization check
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }

    let updatedProductData: Partial<Product>;
    try {
        updatedProductData = await req.json();
    } catch (error) {
        console.error("Invalid JSON in request body:", error);
        return NextResponse.json({ message: "Invalid JSON in request body." }, { status: 400 });
    }

    if (typeof updatedProductData.Product_ID === 'undefined' || updatedProductData.Product_ID === null) {
        return NextResponse.json({ message: "Product_ID is required for update." }, { status: 400 });
    }

    const productIdToUpdate = updatedProductData.Product_ID;
    const updateColumns: string[] = [];
    const queryParams: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    const excludedFields = ['Product_ID']; // Product_ID is used in WHERE, not SET

    for (const key in updatedProductData) {
        if (Object.prototype.hasOwnProperty.call(updatedProductData, key) &&
            updatedProductData[key as keyof Partial<Product>] !== undefined &&
            !excludedFields.includes(key)) {
            
            // Handle empty strings for nullable fields if they are explicitly set to empty
            let valueToSet: string | number | boolean | null = updatedProductData[key as keyof Partial<Product>];
            if (typeof valueToSet === 'string' && valueToSet.trim() === '' && ['Brand', 'Description', 'Image_URL', 'Dimensions', 'Material'].includes(key)) {
                valueToSet = null; // Convert empty string to null for nullable string fields
            }
            if (typeof valueToSet === 'number' && (valueToSet === null || isNaN(valueToSet)) && ['Review_Rating'].includes(key)) {
                valueToSet = null; // Ensure null if number field is supposed to be null
            }
            // Add specific validation for numeric fields during PATCH if present
            if (key === 'Quantity' && typeof valueToSet === 'number' && valueToSet < 0) {
                return NextResponse.json({ message: `"Quantity" cannot be negative.` }, { status: 400 });
            }
            if (key === 'Sale_Cost' && typeof valueToSet === 'number' && valueToSet < 0) {
                return NextResponse.json({ message: `"Sale_Cost" cannot be negative.` }, { status: 400 });
            }
            if (key === 'Sale_Price' && typeof valueToSet === 'number' && valueToSet <= 0) {
                return NextResponse.json({ message: `"Sale_Price" must be greater than 0.` }, { status: 400 });
            }
            if (key === 'Reorder_Point' && typeof valueToSet === 'number' && valueToSet < 0) {
                return NextResponse.json({ message: `"Reorder_Point" cannot be negative.` }, { status: 400 });
            }
            if (key === 'Review_Rating' && typeof valueToSet === 'number' && (valueToSet < 0 || valueToSet > 5)) {
                return NextResponse.json({ message: `"Review_Rating" must be between 0 and 5, or null.` }, { status: 400 });
            }

            updateColumns.push(`"${key}" = $${paramIndex}`);
            queryParams.push(valueToSet);
            paramIndex++;
        }
    }

    if (updateColumns.length === 0) {
        return NextResponse.json({ message: "No valid fields provided for update." }, { status: 400 });
    }

    queryParams.push(productIdToUpdate); // Add Product_ID for the WHERE clause
    const sql = `
        UPDATE public."Product"
        SET ${updateColumns.join(', ')}
        WHERE "Product_ID" = $${paramIndex};
    `;

    try {
        const result = await poolQuery(sql, queryParams);
        if (result.rowCount === 0) {
            return NextResponse.json({ message: `Product with ID ${productIdToUpdate} not found.` }, { status: 404 });
        }
        return NextResponse.json({ message: `Product ID ${productIdToUpdate} updated successfully.` }, { status: 200 });
    } catch (dbError: any) {
        console.error("Error updating product:", dbError);
        return NextResponse.json({ message: "Failed to update product.", error: dbError.message }, { status: 500 });
    }
}

// --- DELETE Product ---
export async function DELETE(req: NextRequest) {
    // Optional: Authorization check
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //     return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    // }

    const productIdToDelete = req.nextUrl.searchParams.get('id');

    if (!productIdToDelete) {
        return NextResponse.json({ message: "Product ID is required as a query parameter for deleting a product." }, { status: 400 });
    }

    const parsedProductId = parseInt(productIdToDelete, 10);
    if (isNaN(parsedProductId)) {
        return NextResponse.json({ message: "Invalid Product ID provided. Must be a number." }, { status: 400 });
    }

    const sql = `DELETE FROM public."Product" WHERE "Product_ID" = $1;`; // Assuming table name is "Product"

    try {
        const result = await poolQuery(sql, [parsedProductId]);
        if (result.rowCount === 0) {
            return NextResponse.json({ message: `Product with ID ${parsedProductId} not found.` }, { status: 404 });
        }
        return NextResponse.json({ message: `Product ID ${parsedProductId} deleted successfully.` }, { status: 200 });
    } catch (dbError: any) {
        console.error("Error deleting product:", dbError);
        // Add specific error handling for foreign key constraints if needed
        return NextResponse.json({ message: "Failed to delete product.", error: dbError.message }, { status: 500 });
    }
}
