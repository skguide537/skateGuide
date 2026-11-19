import { NextRequest, NextResponse } from "next/server";
import { skateparkService } from "@/services/skatepark.service";
import { convertToUploadedFile } from "@/lib/file-utils";
import { Tag } from "@/types/enums";
import { connectToDatabase } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth-helpers";

// GET all skateparks
export async function GET(request: NextRequest) {
    try {
        // In CI environment (not test), return empty array to avoid database connection issues
        if (process.env.CI && process.env.NODE_ENV !== 'test') {
            return NextResponse.json([]);
        }

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

        if (searchParams.has("ids")) {
            const idsParam = searchParams.get("ids");
            if (!idsParam) {
                return NextResponse.json({ error: "Ids parameter is required" }, { status: 400 });
            }
            const ids = idsParam.split(',').filter(Boolean);
            const skateparks = await skateparkService.getSkateparksByIds(ids);
            return NextResponse.json(skateparks);
        }

        if (searchParams.has("page") || searchParams.has("limit")) {
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const page = !isNaN(Number(pageParam)) && Number(pageParam) > 0 ? Number(pageParam) : 1;
    const limit = !isNaN(Number(limitParam)) && Number(limitParam) > 0 ? Number(limitParam) : 10;
    const skip = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
        skateparkService.getPaginatedSkateparks(skip, limit),
        skateparkService.getTotalSkateparksCount()
    ]);

    const response = NextResponse.json({ data, totalCount });
    
    // Add cache headers for better browser caching
    response.headers.set('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=300');
    
    return response;
}

        // Default: get all skateparks
        const skateparks = await skateparkService.getAllSkateparks();
        const response = NextResponse.json(skateparks);
        
        // Add cache headers
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        
        return response;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


// POST new skatepark
export async function POST(request: NextRequest) {
    try {
        // In CI environment (not test), return mock response to avoid database connection issues
        if (process.env.CI && process.env.NODE_ENV !== 'test') {
            return NextResponse.json({ _id: 'mock-id', message: 'Mock response in CI' }, { status: 201 });
        }

        await connectToDatabase();
        
        // Get authenticated user from JWT cookie
        const currentUser = await getUserFromRequest(request);
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized - Please login" }, { status: 401 });
        }

        const formData = await request.formData();
        const parkData = JSON.parse(formData.get("data") as string);
        const files = formData.getAll("photos") as File[];
        const photos = await Promise.all(files.map(convertToUploadedFile));
        const skatepark = await skateparkService.addSkatepark(parkData, photos, currentUser._id.toString());
        return NextResponse.json(skatepark, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 