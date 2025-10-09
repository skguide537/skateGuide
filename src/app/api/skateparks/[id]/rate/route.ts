import { NextRequest, NextResponse } from "next/server";
import { skateparkService } from "@/services/skatepark.service";
import { getUserFromRequest } from "@/lib/auth-helpers";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Get authenticated user from JWT cookie
        const currentUser = await getUserFromRequest(request);
        if (!currentUser) {
            return NextResponse.json({ error: "Unauthorized - Please login" }, { status: 401 });
        }

        const { rating } = await request.json();
        const message = await skateparkService.rateSkatepark(
            params.id,
            currentUser._id.toString(),
            rating
        );

        return NextResponse.json({ message });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 