import { NextRequest, NextResponse } from "next/server";
import { skateparkService } from "@/services/skatepark.service";
import { convertToUploadedFile } from "@/lib/file-utils";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// GET one skatepark
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const skatepark = await skateparkService.getOneSkatepark(params.id);
        return NextResponse.json(skatepark);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
}

// PUT update skatepark
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const updateData = JSON.parse(formData.get("data") as string);
        const files = formData.getAll("photos") as File[];
        
        const photos = await Promise.all(files.map(convertToUploadedFile));
        const skatepark = await skateparkService.updateSkatepark(params.id, updateData, photos);
        return NextResponse.json(skatepark);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE skatepark
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user to check admin role
        const { db } = await connectToDatabase();
        if (!db) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }
        
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(userId) },
            { projection: { role: 1 } }
        );

        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        const message = await skateparkService.deleteSkatepark(params.id);
        return NextResponse.json({ message });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 