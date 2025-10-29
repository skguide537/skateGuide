import { NextRequest, NextResponse } from "next/server";
import { skateparkService } from "@/services/skatepark.service";
import { convertToUploadedFile } from "@/lib/file-utils";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getUserFromRequest } from "@/lib/auth-helpers";

// GET one skatepark
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Ensure DB connection is established before querying
        await connectToDatabase();

        const skateparkDoc = await skateparkService.getOneSkatepark(params.id);
        // Ensure we return a plain JSON object (not a Mongoose Document with internals)
        const skatepark = (typeof (skateparkDoc as any)?.toObject === 'function')
            ? (skateparkDoc as any).toObject()
            : JSON.parse(JSON.stringify(skateparkDoc));

        // Compute userRating for current user (null if unauthenticated or unrated)
        let userRating: number | null = null;
        try {
            const currentUser = await getUserFromRequest(request);
            if (currentUser && Array.isArray((skatepark as any).rating)) {
                const existing = (skatepark as any).rating.find(
                    (r: any) => r?.userId?.toString?.() === currentUser._id?.toString?.()
                );
                userRating = typeof existing?.value === 'number' ? existing.value : null;
            }
        } catch {
            userRating = null;
        }

        // Count favorites and comments (excluding soft-deleted)
        let favoritesCount = 0;
        let commentsCount = 0;
        try {
            const { db } = await connectToDatabase();
            if (db) {
                favoritesCount = await db
                    .collection('users')
                    .countDocuments({ favorites: new ObjectId(params.id) });
                commentsCount = await db
                    .collection('comments')
                    .countDocuments({
                        skateparkId: new ObjectId(params.id),
                        isDeleted: { $ne: true },
                    });
            }
        } catch {
            favoritesCount = 0;
            commentsCount = 0;
        }

        const responsePayload = {
            ...skatepark,
            userRating,
            favoritesCount,
            commentsCount,
        };

        return NextResponse.json(responsePayload);
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
        // 1. Authenticate user from JWT token
        const currentUser = await getUserFromRequest(request);
        
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized - Please login" }, { status: 401 });
        }

        // 2. Get skatepark to check ownership
        const { db } = await connectToDatabase();
        if (!db) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }
        
        const skatepark = await db.collection('skateparks').findOne(
            { _id: new ObjectId(params.id) }
        );

        if (!skatepark) {
            return NextResponse.json({ error: "Skatepark not found" }, { status: 404 });
        }

        // 3. Check if user owns the skatepark OR is admin
        const isOwner = skatepark.createdBy && skatepark.createdBy.toString() === currentUser._id.toString();
        const isAdmin = currentUser.role === 'admin';

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ 
                error: "Forbidden - You can only edit your own skateparks" 
            }, { status: 403 });
        }

        // 4. Update skatepark
        const formData = await request.formData();
        const updateData = JSON.parse(formData.get("data") as string);
        const files = formData.getAll("photos") as File[];
        
        const photos = await Promise.all(files.map(convertToUploadedFile));
        const updatedSkatepark = await skateparkService.updateSkatepark(params.id, updateData, photos);
        return NextResponse.json(updatedSkatepark);
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
        // 1. Authenticate user from JWT token
        const currentUser = await getUserFromRequest(request);
        
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized - Please login" }, { status: 401 });
        }

        // 2. Check if current user is admin (only admins can delete)
        if (currentUser.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
        }

        // 3. Connect to database
        const { db } = await connectToDatabase();
        if (!db) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        // 4. Delete skatepark
        const message = await skateparkService.deleteSkatepark(params.id);
        return NextResponse.json({ message });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 