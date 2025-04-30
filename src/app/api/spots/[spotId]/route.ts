import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Spot from '@/models/Spot';

export async function PUT(req: Request, { params }: { params: { spotId: string } }) {
  try {
    await connectToDatabase();
    const updatedData = await req.json();
    const updatedSpot = await Spot.findByIdAndUpdate(params.spotId, updatedData, { new: true });
    return NextResponse.json(updatedSpot);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { spotId: string } }) {
  try {
    await connectToDatabase();
    const deletedSpot = await Spot.findByIdAndDelete(params.spotId);
    return NextResponse.json(deletedSpot);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
