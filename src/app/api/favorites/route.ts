import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getUserFromRequest } from "@/lib/auth-helpers";

// GET user's favorites or public counts per spot
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const countsOnly = searchParams.get('counts') === 'true';

        const { db } = await connectToDatabase();
        if (!db) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        if (countsOnly) {
            const spotIdsParam = searchParams.get('spotIds') || '';
            const spotIds = spotIdsParam.split(',').filter(Boolean);
            if (spotIds.length === 0) return NextResponse.json({ counts: {} });

            const pipeline = [
                { $project: { favorites: 1 } },
                { $unwind: '$favorites' },
                { $match: { favorites: { $in: spotIds.map(id => new ObjectId(id)) } } },
                { $group: { _id: '$favorites', count: { $sum: 1 } } }
            ];
            const results = await db.collection('users').aggregate(pipeline).toArray();
            const counts: Record<string, number> = {};
            for (const row of results) counts[row._id.toString()] = row.count;
            return NextResponse.json({ counts });
        }

        // Get authenticated user from JWT cookie
        const currentUser = await getUserFromRequest(request);
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized - Please login" }, { status: 401 });
        }

        const user = await db.collection('users').findOne(
            { _id: new ObjectId(currentUser._id) },
            { projection: { favorites: 1 } }
        );

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const favoritesArray = user.favorites || [];
        const favoritesStrings = favoritesArray.map((fav: any) => fav.toString());
        return NextResponse.json({ favorites: favoritesStrings });
    } catch (error: any) {
        // Log error in development only
        if (process.env.NODE_ENV === 'development') {
            console.error('Get favorites error:', error);
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST add/remove spot from favorites (toggle)
export async function POST(request: NextRequest) {
    try {
        // Get authenticated user from JWT cookie
        const currentUser = await getUserFromRequest(request);
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized - Please login" }, { status: 401 });
        }

        const { spotId } = await request.json();
        if (!spotId) {
            return NextResponse.json({ error: "Spot ID is required" }, { status: 400 });
        }

        const { db } = await connectToDatabase();
        if (!db) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        // Check if spot exists
        const spot = await db.collection('skateparks').findOne(
            { _id: new ObjectId(spotId) },
            { projection: { _id: 1 } }
        );

        if (!spot) {
            return NextResponse.json({ error: "Spot not found" }, { status: 404 });
        }

        // Get current user favorites
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(currentUser._id) },
            { projection: { favorites: 1 } }
        );

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const currentFavorites = user.favorites || [];
        const spotObjectId = new ObjectId(spotId);
        
        let newFavorites: ObjectId[];
        let action: 'added' | 'removed';

        if (currentFavorites.some((fav: any) => fav.toString() === spotId)) {
            // Remove from favorites
            newFavorites = currentFavorites.filter((fav: any) => fav.toString() !== spotId);
            action = 'removed';
        } else {
            // Add to favorites
            newFavorites = [...currentFavorites, spotObjectId];
            action = 'added';
        }

        // Update user's favorites
        await db.collection('users').updateOne(
            { _id: new ObjectId(currentUser._id) },
            { $set: { favorites: newFavorites } }
        );

        // Compute new count for this spot
        const count = await db.collection('users').countDocuments({ favorites: spotObjectId });

        return NextResponse.json({ 
            message: `Spot ${action} from favorites`,
            action,
            count,
            favorites: newFavorites.map((fav: any) => fav.toString())
        });
    } catch (error: any) {
        // Log error in development only
        if (process.env.NODE_ENV === 'development') {
            console.error('Toggle favorite error:', error);
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
