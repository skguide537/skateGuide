import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Spot from '@/models/Spot';

export async function GET() {
    try {
        await connectToDatabase(); // Ensures mongoose is connected
        const spots = await Spot.find().populate('createdBy');
        return NextResponse.json(spots);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const spotData = await req.json();
        const newSpot = await Spot.create(spotData);
        return NextResponse.json(newSpot);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
