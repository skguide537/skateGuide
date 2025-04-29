import { connectToDatabase } from '@/lib/mongodb';
import Spot from '@/models/Spot';

export async function getSpots() {
  try {
    const { db } = await connectToDatabase();
    const spots = await Spot.find({}).populate('createdBy', 'name email');
    return spots;
  } catch (error) {
    throw new Error('Failed to fetch spots');
  }
}

export async function createSpot(spotData: any, userId: string) {
  try {
    const { db } = await connectToDatabase();
    const spot = new Spot({
      ...spotData,
      createdBy: userId,
    });
    await spot.save();
    return spot;
  } catch (error) {
    throw new Error('Failed to create spot');
  }
}

export async function getSpotsNearLocation(latitude: number, longitude: number, radius: number = 5000) {
  try {
    const { db } = await connectToDatabase();
    const spots = await Spot.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radius,
        },
      },
    }).populate('createdBy', 'name email');
    return spots;
  } catch (error) {
    throw new Error('Failed to fetch nearby spots');
  }
} 