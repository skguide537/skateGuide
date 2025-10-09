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

        const { reason } = await request.json();
        const message = await skateparkService.reportSkatepark(
            params.id,
            currentUser._id.toString(),
            reason
        );

        return NextResponse.json({ message });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 