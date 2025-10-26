import { connectToDatabase } from '@/lib/mongodb';
import { BadRequestError, NotFoundError } from '@/types/error-models';
import User from '@/models/User';
import { skateparkService } from './skatepark.service';
import { commentService } from './comment.service';
import cloudinary from '@/lib/cloudinary';
import { UploadedFile } from 'express-fileupload';
import { logger } from '@/lib/logger';
import { DEFAULT_AVATAR_URL } from '@/types/constants';
import mongoose from 'mongoose';

export interface UserProfile {
    _id: string;
    name: string;
    email: string;
    role: string;
    photoUrl: string;
    bio: string;
    instagram: string;
    tiktok: string;
    youtube: string;
    website: string;
    createdAt: Date;
}

export interface PaginatedSpotsResponse {
    data: any[];
    total: number;
    page: number;
    limit: number;
}

export interface UserCommentsResponse {
    comments: Array<{
        id: string;
        body: string;
        createdAt: Date;
        skateparkId: string;
        skateparkTitle: string;
        editedAt?: Date;
    }>;
    total: number;
}

export interface UserStats {
    totalSpots: number;
    totalComments: number;
    avgRating: number;
}

export interface BioSocialsUpdate {
    bio?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
}

export interface PhotoUpdate {
    photoUrl: string;
    photoId: string;
}

class UserService {
    // Helper: Extract Cloudinary public ID from URL
    private extractCloudinaryPublicId(url: string): string | null {
        const match = url.match(/\/upload\/v\d+\/(.+?)\.(jpg|jpeg|png|webp|gif)$/);
        if (match) {
            return match[1];
        }
        return null;
    }

    // Helper: Check if URL is default image
    private isDefaultImage(url: string): boolean {
        return url.includes("default-user") || !url.includes("cloudinary.com");
    }

    // Helper: Upload to Cloudinary
    private async uploadToCloudinary(photo: UploadedFile): Promise<string> {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "users" },
                (error, result) => {
                    if (error || !result) reject(new Error("Cloudinary upload failed"));
                    else resolve(result.secure_url);
                }
            );
            stream.end(photo.data);
        });
    }

    // Get user profile (no password)
    public async getUserProfile(userId: string): Promise<UserProfile> {
        await connectToDatabase();
        
        const user = await User.findById(userId).select('-password');
        if (!user) throw new NotFoundError(`User with ID ${userId} not found`);

        return {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            photoUrl: user.photoUrl,
            bio: user.bio || '',
            instagram: user.instagram || '',
            tiktok: user.tiktok || '',
            youtube: user.youtube || '',
            website: user.website || '',
            createdAt: user.createdAt,
        };
    }

    // Get user's spots (paginated)
    public async getUserSpots(userId: string, page: number, limit: number): Promise<PaginatedSpotsResponse> {
        await connectToDatabase();

        const skip = (page - 1) * limit;
        const total = await skateparkService.getSkateparksBySkater(userId);
        
        // Get paginated results
        const { db } = await connectToDatabase();
        if (!db) {
            throw new Error('Database connection failed');
        }
        
        const spots = await db.collection('skateparks')
            .find({ createdBy: userId })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .toArray();

        return {
            data: spots,
            total: total.length,
            page,
            limit,
        };
    }

    // Get user's recent comments
    public async getUserComments(userId: string, limit: number = 5): Promise<UserCommentsResponse> {
        await connectToDatabase();
        
        const { db } = await connectToDatabase();
        if (!db) {
            throw new Error('Database connection failed');
        }
        
        // Convert userId string to ObjectId
        const userIdObjectId = new mongoose.Types.ObjectId(userId);
        
        // Join comments with skateparks to get titles
        const comments = await db.collection('comments')
            .aggregate([
                { $match: { userId: userIdObjectId } },
                { $sort: { createdAt: -1 } },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'skateparks',
                        localField: 'skateparkId',
                        foreignField: '_id',
                        as: 'skatepark'
                    }
                },
                { $unwind: { path: '$skatepark', preserveNullAndEmptyArrays: true } }
            ])
            .toArray();

        const formatted = comments.map(c => ({
            id: c._id.toString(),
            body: c.body,
            createdAt: c.createdAt,
            skateparkId: c.skateparkId.toString(),
            skateparkTitle: c.skatepark?.title || 'Unknown Skatepark',
            editedAt: c.editedAt,
        }));

        const total = await db.collection('comments').countDocuments({ userId: userIdObjectId });

        return { comments: formatted, total };
    }

    // Get user statistics
    public async getUserStats(userId: string): Promise<UserStats> {
        await connectToDatabase();
        
        const spots = await skateparkService.getSkateparksBySkater(userId);
        
        const totalSpots = spots.length;
        
        // Count comments
        const { db } = await connectToDatabase();
        if (!db) {
            throw new Error('Database connection failed');
        }
        
        // Convert userId string to ObjectId
        const userIdObjectId = new mongoose.Types.ObjectId(userId);
        
        const totalComments = await db.collection('comments').countDocuments({ userId: userIdObjectId });
        
        // Calculate average rating from all user's spots
        let avgRating = 0;
        if (totalSpots > 0) {
            const ratingsSum = spots.reduce((sum, spot) => sum + (spot.avgRating || 0), 0);
            avgRating = ratingsSum / totalSpots;
        }

        return {
            totalSpots,
            totalComments,
            avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        };
    }

    // Update bio and social links
    public async updateBioAndSocials(userId: string, data: BioSocialsUpdate): Promise<UserProfile> {
        await connectToDatabase();
        
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError(`User with ID ${userId} not found`);

        if (data.bio !== undefined) user.bio = data.bio;
        if (data.instagram !== undefined) user.instagram = data.instagram;
        if (data.tiktok !== undefined) user.tiktok = data.tiktok;
        if (data.youtube !== undefined) user.youtube = data.youtube;
        if (data.website !== undefined) user.website = data.website;

        await user.save();
        return this.getUserProfile(userId);
    }

    // Update password
    public async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        await connectToDatabase();
        
        const user = await User.findById(userId).select('+password');
        if (!user) throw new NotFoundError(`User with ID ${userId} not found`);

        // Verify current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) throw new BadRequestError('Current password is incorrect');

        // Update password
        user.password = newPassword;
        await user.save();
    }

    // Update profile photo
    public async updateProfilePhoto(userId: string, photo: UploadedFile): Promise<PhotoUpdate> {
        await connectToDatabase();
        
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError(`User with ID ${userId} not found`);

        // Delete old photo if not default
        if (!this.isDefaultImage(user.photoUrl)) {
            const publicId = this.extractCloudinaryPublicId(user.photoUrl);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (error) {
                    logger.error('Failed to delete old photo from Cloudinary', error, 'UserService');
                }
            }
        }

        // Upload new photo
        const photoUrl = await this.uploadToCloudinary(photo);
        const photoId = photoUrl.split('/upload/')[1].split('.')[0]; // Extract ID from URL

        // Update user
        user.photoUrl = photoUrl;
        user.photoId = photoId;
        await user.save();

        return { photoUrl, photoId };
    }

    // Delete profile photo
    public async deleteProfilePhoto(userId: string): Promise<void> {
        await connectToDatabase();
        
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError(`User with ID ${userId} not found`);

        // Check if already using default photo
        if (this.isDefaultImage(user.photoUrl)) {
            throw new BadRequestError('Cannot delete the default profile picture');
        }

        // Delete from Cloudinary
        const publicId = this.extractCloudinaryPublicId(user.photoUrl);
        if (publicId) {
            try {
                await cloudinary.uploader.destroy(publicId);
            } catch (error) {
                logger.error('Failed to delete photo from Cloudinary', error, 'UserService');
            }
        }

        // Set to default
        user.photoUrl = DEFAULT_AVATAR_URL;
        user.photoId = 'users/default-user';
        await user.save();
    }

    // Delete user account
    public async deleteUserAccount(userId: string): Promise<void> {
        await connectToDatabase();
        
        const user = await User.findById(userId);
        if (!user) throw new NotFoundError(`User with ID ${userId} not found`);

        // Get or create deleted-user sentinel
        const { db } = await connectToDatabase();
        if (!db) {
            throw new Error('Database connection failed');
        }
        
        let deletedUserDoc = await db.collection('users').findOne({ email: 'deleted@system' });
        let sentinelId: mongoose.Types.ObjectId;
        
        if (!deletedUserDoc) {
            // Create sentinel user - bypass validation for system user
            const sentinelData = {
                name: 'Deleted User',
                email: 'deleted@system',
                password: 'deleted',
                role: 'user',
                photoUrl: DEFAULT_AVATAR_URL,
                photoId: 'users/default-user',
            };
            
            // Insert directly to bypass Mongoose validation
            const result = await db.collection('users').insertOne(sentinelData);
            logger.info('Created deleted-user sentinel', undefined, 'UserService');
            
            sentinelId = result.insertedId;
        } else {
            sentinelId = deletedUserDoc._id as unknown as mongoose.Types.ObjectId;
        }

        // Update all skateparks
        await db.collection('skateparks').updateMany(
            { createdBy: userId },
            { $set: { createdBy: sentinelId } }
        );

        // Update all comments
        await db.collection('comments').updateMany(
            { userId: userId },
            { $set: { userId: sentinelId } }
        );

        // Delete user's photo if not default
        if (!this.isDefaultImage(user.photoUrl)) {
            const publicId = this.extractCloudinaryPublicId(user.photoUrl);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (error) {
                    logger.error('Failed to delete user photo from Cloudinary', error, 'UserService');
                }
            }
        }

        // Delete user document
        await User.findByIdAndDelete(userId);
        
        logger.info(`User ${userId} deleted, spots and comments assigned to deleted-user`, undefined, 'UserService');
    }
}

export const userService = new UserService();

