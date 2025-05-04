import { NextRequest, NextResponse } from "next/server";
import { skateparkService } from "@/services/skatepark.service";
import { convertToUploadedFile } from "@/lib/file-utils";

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

        const message = await skateparkService.deleteSkatepark(params.id);
        return NextResponse.json({ message });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 