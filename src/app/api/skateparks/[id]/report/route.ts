import { NextRequest, NextResponse } from "next/server";
import { skateparkService } from "@/services/skatepark.service";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = request.headers.get("x-user-id");
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { reason } = await request.json();
        const message = await skateparkService.reportSkatepark(
            params.id,
            userId,
            reason
        );

        return NextResponse.json({ message });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 