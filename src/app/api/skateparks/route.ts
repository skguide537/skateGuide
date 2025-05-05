import { NextRequest, NextResponse } from "next/server";
import { skateparkService } from "@/services/skatepark.service";
import { convertToUploadedFile } from "@/lib/file-utils";
import { Tag } from "@/types/enums";
import { connectToDatabase } from "@/lib/mongodb";

// GET all skateparks
export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        
        // Handle different query parameters
        if (searchParams.has("search")) {
            const query = Object.fromEntries(searchParams.entries());
            const skateparks = await skateparkService.findSkateparks(query);
            return NextResponse.json(skateparks);
        }

        if (searchParams.has("advanced")) {
            const query = Object.fromEntries(searchParams.entries());
            const skateparks = await skateparkService.advancedSearch(query);
            return NextResponse.json(skateparks);
        }

        if (searchParams.has("tags")) {
            const tagStrings = searchParams.get("tags")?.split(",") || [];
            const tags = tagStrings.map(tag => Tag[tag as keyof typeof Tag]).filter(Boolean);
            const skateparks = await skateparkService.getSkateparksByTags(tags);
            return NextResponse.json(skateparks);
        }

        if (searchParams.has("near")) {
            const [lat, lng, radius] = searchParams.get("near")?.split(",") || [];
            const coords = { latitude: Number(lat), longitude: Number(lng) };
            const skateparks = await skateparkService.getSkateparksNearLocation(coords, Number(radius));
            return NextResponse.json(skateparks);
        }

        if (searchParams.has("top-rated")) {
            const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
            const skateparks = await skateparkService.getTopRatedSkateparks(limit);
            return NextResponse.json(skateparks);
        }

        if (searchParams.has("recent")) {
            const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 3;
            const skateparks = await skateparkService.getRecentSkateparks(limit);
            return NextResponse.json(skateparks);
        }

        // Default: get all skateparks
        const skateparks = await skateparkService.getAllSkateparks();
        return NextResponse.json(skateparks);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST new skatepark
export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const parkData = JSON.parse(formData.get("data") as string);
        const files = formData.getAll("photos") as File[];
        const photos = await Promise.all(files.map(convertToUploadedFile));
        const skatepark = await skateparkService.addSkatepark(parkData, photos, userId);
        return NextResponse.json(skatepark, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 