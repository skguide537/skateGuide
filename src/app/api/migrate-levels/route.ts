import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { SkateparkModel } from '@/models/skatepark.model';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();
        
        // Find all skateparks that either have the old 'level' field OR have 'levels' array with null values
        // Use lean() to get raw document data and explicitly include the level field
        const oldSkateparks = await SkateparkModel.find({
            $or: [
                { level: { $exists: true } },
                { levels: { $elemMatch: { $eq: null } } }
            ]
        }).lean();
        
        if (oldSkateparks.length === 0) {
            return NextResponse.json({ 
                message: 'No migration needed - all skateparks already have the new format',
                migrated: 0 
            });
        }

        let migratedCount = 0;
        
        // Update each skatepark
        for (const skatepark of oldSkateparks) {
            let newLevels: string[] = [];
            
            // Check if it has the old level field with a valid value
            if ((skatepark as any).level && (skatepark as any).level !== null && (skatepark as any).level !== undefined) {
                const oldLevel = (skatepark as any).level;
                newLevels = [oldLevel];
            }
            // Check if it has levels array with null values
            else if ((skatepark as any).levels && Array.isArray((skatepark as any).levels) && (skatepark as any).levels.some((level: any) => level === null)) {
                // If we have null levels but no valid old level, default to beginner
                newLevels = ['beginner'];
            }
            
            if (newLevels.length > 0) {
                await SkateparkModel.updateOne(
                    { _id: skatepark._id },
                    { 
                        $set: { levels: newLevels },
                        $unset: { level: "" }
                    }
                );
                
                migratedCount++;
            }
        }

        // Verify the migration
        const remainingOldSkateparks = await SkateparkModel.find({
            $or: [
                { level: { $exists: true } },
                { levels: { $elemMatch: { $eq: null } } }
            ]
        }).lean();
        
        const newSkateparks = await SkateparkModel.find({ 
            levels: { $exists: true, $ne: [], $not: { $elemMatch: { $eq: null } } }
        }).lean();
        
        return NextResponse.json({
            message: 'Migration completed successfully',
            migrated: migratedCount,
            remainingOldFormat: remainingOldSkateparks.length,
            newFormat: newSkateparks.length,
            details: {
                remainingOld: remainingOldSkateparks.map(s => ({ id: s._id, title: s.title, level: (s as any).level, levels: (s as any).levels })),
                newFormat: newSkateparks.map(s => ({ id: s._id, title: s.title, levels: (s as any).levels }))
            }
        });

    } catch (error) {
        logger.error('Migration failed', error as Error, { component: 'migrate-levels' });
        return NextResponse.json(
            { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
