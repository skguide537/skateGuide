import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
    try {
        const { imageUrl } = await req.json();
        
        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }

        // Extract public ID from URL
        const match = imageUrl.match(/\/upload\/v\d+\/(.+?)\.(jpg|jpeg|png|webp|gif)$/);
        if (!match) {
            return NextResponse.json({ error: 'Could not extract public ID from URL' }, { status: 400 });
        }

        const publicId = match[1];
        console.log(`Testing Cloudinary deletion with public ID: ${publicId}`);

        // Attempt to delete
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('Cloudinary deletion result:', result);

        return NextResponse.json({
            message: 'Test deletion completed',
            publicId,
            result
        });

    } catch (error: any) {
        console.error('Test deletion error:', error);
        return NextResponse.json({ 
            error: 'Test deletion failed', 
            details: error.message 
        }, { status: 500 });
    }
}
