import cloudinary from "@/lib/cloudinary";
import { cache, cacheKeys } from "@/lib/cache";
import { BadRequestError, NotFoundError } from "@/types/error-models";
import { UploadedFile } from "express-fileupload";
import { ISkateparkModel, SkateparkModel } from "../models/skatepark.model";
import { Coords, ExternalLinks, IReport, Size, SkaterLevel, Tag } from "../types/enums";
import { DEFAULT_IMAGE_URL } from "../types/constants";
import { logger } from "@/lib/logger";
import { CreateSkateparkRequest, BaseSkatepark, ExternalLink } from "@/types/skatepark";
import User from "@/models/User";
import mongoose from "mongoose";

class SkateparkService {
    // 1. Helper Functions:

    protected async checkSkatepark(_id: string): Promise<ISkateparkModel> {
        const skatepark = await SkateparkModel.findById(_id);
        if (!skatepark) throw new NotFoundError(`Skatepark with _id ${_id} not found.`);
        return skatepark;
    }

    protected async getPhotoNames(_id: string): Promise<string[]> {
        const skatepark = await this.checkSkatepark(_id);
        if (skatepark.photoNames.length === 0) return [`This skatepark has no photos.`];
        return skatepark.photoNames;
    }

    private async uploadToCloudinary(photo: UploadedFile): Promise<string> {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "skateparks" },
                (error, result) => {
                    if (error || !result) reject(new Error("Cloudinary upload failed"));
                    else resolve(result.secure_url);
                }
            );
            stream.end(photo.data);
        });
    }

    private extractCloudinaryPublicId(url: string): string | null {
        // Cloudinary URLs look like: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/image_name.jpg
        // We need to extract: folder/image_name (without extension)
        const match = url.match(/\/upload\/v\d+\/(.+?)\.(jpg|jpeg|png|webp|gif)$/);
        if (match) {
            return match[1]; // This gives us the public ID
        }
        return null;
    }

    private isDefaultImage(url: string): boolean {
        // Check if the URL contains any default/fallback image patterns
        return url.includes("default-skatepark") || 
               url.includes("default-skatepark.jpg") || 
               url.includes("default-skatepark.png") ||
               url.includes("default-user") ||
               !url.includes("cloudinary.com"); // Don't delete non-Cloudinary images
    }


    // 2. GETs:

    public async getTotalSkateparksCount(): Promise<number> {
        const cacheKey = cacheKeys.totalCount();
        const cached = cache.get<number>(cacheKey);
        
        if (cached !== null) {
            return cached;
        }

        const count = await SkateparkModel.countDocuments();
        cache.set(cacheKey, count, 10 * 60 * 1000); // Cache for 10 minutes
        return count;
    }

    public async getAllSkateparks(): Promise<ISkateparkModel[]> {
        const cacheKey = cacheKeys.allSkateparks();
        const cached = cache.get<ISkateparkModel[]>(cacheKey);
        
        if (cached !== null) {
            return cached;
        }

        // Optimize query with lean() and select only needed fields
        const skateparks = await SkateparkModel
            .find()
            .select('title description tags location photoNames isPark size levels avgRating rating externalLinks')
            .populate("externalLinks.sentBy", "name")
            .lean()
            .exec();

        cache.set(cacheKey, skateparks as unknown as ISkateparkModel[], 5 * 60 * 1000); // Cache for 5 minutes
        return skateparks as unknown as ISkateparkModel[];
    }

    public async getSkateparksByIds(ids: string[]): Promise<ISkateparkModel[]> {
        const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));
        
        const skateparks = await SkateparkModel
            .find({ _id: { $in: objectIds } })
            .select('title description tags location photoNames isPark size levels avgRating rating externalLinks')
            .populate("externalLinks.sentBy", "name")
            .lean()
            .exec();

        return skateparks as unknown as ISkateparkModel[];
    }


    public async getOneSkatepark(_id: string): Promise<ISkateparkModel> {
        const skatepark = await SkateparkModel.findById(_id)
            .populate("externalLinks.sentBy", "name")
            .populate("createdBy", "name photoUrl")
            .exec();

        if (!skatepark) throw new NotFoundError(`Skatepark with _id ${_id} not found.`);
        // Fallback: in case legacy docs store createdBy as string (not ObjectId) and populate returns null
        const createdByAny: any = (skatepark as any).createdBy;
        if (!createdByAny || typeof createdByAny === 'string') {
            const creatorId = typeof createdByAny === 'string' ? createdByAny : undefined;
            if (creatorId) {
                try {
                    const creator = await User.findById(creatorId).select('name photoUrl').lean();
                    if (creator) {
                        (skatepark as any).createdBy = {
                            _id: (creator as any)?._id?.toString?.() || creatorId,
                            name: (creator as any).name || 'Unknown',
                            photoUrl: (creator as any).photoUrl || undefined,
                        };
                    }
                } catch {
                    // ignore and leave as-is
                }
            }
        }
        return skatepark;
    }


    public async findSkateparks(partialData: Partial<ISkateparkModel>): Promise<ISkateparkModel[]> {
        const query: Record<string, any> = {};
        for (const key in partialData) {
            const value = partialData[key as keyof ISkateparkModel];
            if (typeof value === "string") query[key] = { $regex: value, $options: "i" };
            else query[key] = value;
        }
        const skateparks = await SkateparkModel.find(query);
        if (skateparks.length === 0) throw new NotFoundError(`No skateparks in those search terms.`);
        return skateparks;
    }


    // refactor, and than perfect for home page
    public async advancedSearch(filters: {
        size?: Size;
        levels?: SkaterLevel[];
        tags?: Tag[];
        isPark?: boolean;
    }): Promise<ISkateparkModel[]> {
        const query: Record<string, any> = {};
        if (filters.size) query.size = filters.size;
        if (filters.levels && filters.levels.length > 0) query.levels = { $in: filters.levels };
        if (filters.isPark !== undefined) query.isPark = filters.isPark;
        if (filters.tags && filters.tags.length > 0) query.tags = { $in: filters.tags };

        const parks = await SkateparkModel.find(query);
        if (parks.length === 0) throw new NotFoundError("No parks found for the given filters.");
        return parks;
    }

    public async getSkateparksBySkater(userId: string): Promise<ISkateparkModel[]> {
        const skateparks = await SkateparkModel.find({ createdBy: userId })
            .populate("externalLinks.sentBy", "name")
            .exec();

        // Return empty array instead of throwing error when no parks found
        // This is expected for users who haven't posted any spots yet
        return skateparks;
    }


    public async getSkateparksNearLocation(coords: Coords, radiusKm: number): Promise<ISkateparkModel[]> {
        const radiusInMeters = radiusKm * 1000;

        const skateparks = await SkateparkModel.find({
            location: {
                $nearSphere: {
                    $geometry: {
                        type: "Point",
                        coordinates: [coords.longitude, coords.latitude]
                    },
                    $maxDistance: radiusInMeters
                }
            }
        })
            .populate("externalLinks.sentBy", "name")
            .exec();

        if (skateparks.length === 0) throw new NotFoundError("No skateparks found near this location.");
        return skateparks;
    }


    public async getTopRatedSkateparks(limit?: number): Promise<ISkateparkModel[]> {
        const allSkateparks = await SkateparkModel.find()
            .populate("externalLinks.sentBy", "name")
            .exec();

        const sorted = allSkateparks
            .filter(p => p.rating.length > 0)
            .sort((a, b) => {
                const avgA = a.rating.reduce((acc: number, r: { value: number }) => acc + (r.value || 0), 0) / a.rating.length;
                const avgB = b.rating.reduce((acc: number, r: { value: number }) => acc + (r.value || 0), 0) / b.rating.length;

                return avgB - avgA;
            });

        return limit ? sorted.slice(0, limit) : sorted;
    }


    public async getSkateparksByTags(tags: Tag[]): Promise<ISkateparkModel[]> {
        if (!tags || tags.length === 0) throw new BadRequestError(`Missing tags for search.`);

        const parks = await SkateparkModel.find({ tags: { $in: tags } });
        if (parks.length === 0) throw new NotFoundError(`No parks found with the given tags.`);

        return parks;
    }

    public async getRecentSkateparks(limit: number = 3): Promise<ISkateparkModel[]> {
        return SkateparkModel.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("externalLinks.sentBy", "name")
            .exec();
    }


    public async getPaginatedSkateparks(skip: number, limit: number) {
        const page = Math.floor(skip / limit) + 1;
        const cacheKey = cacheKeys.paginatedSkateparks(page, limit);
        const cached = cache.get<BaseSkatepark[]>(cacheKey);
        
        if (cached !== null) {
            return cached;
        }

        const rawParks = await SkateparkModel.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('title description tags location photoNames isPark size levels avgRating rating externalLinks createdAt')
            .populate('externalLinks.sentBy', 'name')
            .lean();

        const parks = rawParks.map((park: any) => ({
            ...park,
            externalLinks: park.externalLinks?.map((link: any) => ({
                ...link,
                sentBy: link.sentBy
                    ? {
                        id: link.sentBy._id?.toString() || "unknown",
                        name: link.sentBy.name || "Unknown"
                    }
                    : undefined
            }))
        }));

        cache.set(cacheKey, parks, 3 * 60 * 1000); // Cache for 3 minutes
        return parks;
    }


    // 3. CRUDs:
    public async deleteSkatepark(_id: string): Promise<string> {
        const skatepark = await this.checkSkatepark(_id);
        const photoNames = skatepark.photoNames;

        logger.info(`Deleting skatepark: ${skatepark.title} with ${photoNames.length} photos`, undefined, 'SkateparkService');

        // Delete from database first
        await SkateparkModel.findByIdAndDelete(_id);
        logger.info(`Skatepark deleted from database`, undefined, 'SkateparkService');

        // Delete photos from Cloudinary
        for (const url of photoNames) {
            logger.debug(`Processing photo URL: ${url}`, undefined, 'SkateparkService');
            
            // Don't delete default/fallback images from Cloudinary
            if (!this.isDefaultImage(url)) {
                const publicId = this.extractCloudinaryPublicId(url);
                if (publicId) {
                    try {
                        logger.debug(`Attempting to delete from Cloudinary with public ID: ${publicId}`, undefined, 'SkateparkService');
                        const result = await cloudinary.uploader.destroy(publicId);
                        logger.debug(`Cloudinary deletion result:`, result, 'SkateparkService');
                    } catch (error) {
                        logger.error(`Failed to delete image from Cloudinary: ${publicId}`, error, 'SkateparkService');
                    }
                } else {
                    logger.warn(`Could not extract public ID from URL: ${url}`, undefined, 'SkateparkService');
                }
            } else {
                logger.debug(`Protecting default/fallback image: ${url}`, undefined, 'SkateparkService');
            }
        }

        return `Skatepark ${skatepark.title} has been deleted.`;
    }

    public async deleteMultipleParks(_idArray: string[]): Promise<string> {
        for (const _id of _idArray) {
            const skatepark = await this.checkSkatepark(_id);
            const photoUrls = await this.getPhotoNames(_id);

            logger.info(`Deleting multiple skatepark: ${skatepark.title} with ${photoUrls.length} photos`, undefined, 'SkateparkService');

            await SkateparkModel.findByIdAndDelete(_id);

            for (const url of photoUrls) {
                logger.debug(`Processing photo URL: ${url}`, undefined, 'SkateparkService');
                
                // Don't delete default/fallback images from Cloudinary
                if (!this.isDefaultImage(url)) {
                    const publicId = this.extractCloudinaryPublicId(url);
                    if (publicId) {
                        try {
                            logger.debug(`Attempting to delete from Cloudinary with public ID: ${publicId}`, undefined, 'SkateparkService');
                            const result = await cloudinary.uploader.destroy(publicId);
                            logger.debug(`Cloudinary deletion result:`, result, 'SkateparkService');
                        } catch (error) {
                            logger.error(`Failed to delete image from Cloudinary: ${publicId}`, error, 'SkateparkService');
                        }
                    } else {
                        logger.warn(`Could not extract public ID from URL: ${url}`, undefined, 'SkateparkService');
                    }
                } else {
                    logger.debug(`Protecting default/fallback image: ${url}`, undefined, 'SkateparkService');
                }
            }
        }

        return `All skateparks deleted.`;
    }


    public async addSkatepark(parkData: CreateSkateparkRequest, photos: UploadedFile[], userId: string): Promise<ISkateparkModel> {
        // Normalize and validate location
        const lng = parkData?.location?.coordinates?.[0];
        const lat = parkData?.location?.coordinates?.[1];

        if (
            typeof lng !== "number" ||
            typeof lat !== "number" ||
            isNaN(lng) ||
            isNaN(lat)
        ) throw new BadRequestError("Invalid or missing coordinates.");

        // Prevent duplicate location
        const existing = await SkateparkModel.findOne({
            "location.coordinates": [lng, lat]
        });
        if (existing) throw new BadRequestError("A skatepark already exists at this location.");

        const skatepark = new SkateparkModel({
            title: parkData.title,
            description: parkData.description,
            tags: parkData.tags,
            location: {
                type: "Point",
                coordinates: [lng, lat]
            },
            size: parkData.size,
            levels: parkData.levels,
            isPark: parkData.isPark,
            rating: [],
            createdBy: userId,
            externalLinks: (parkData.externalLinks || []).map((link: ExternalLink) => ({
                url: link.url,
                sentBy: link.sentBy?.id || userId,
                sentAt: new Date(link.sentAt || Date.now())
            })),
            reports: [],
            photoNames: []
        });


        // Upload to Cloudinary or fallback to default
        if (!photos || photos.length === 0) skatepark.photoNames.push(DEFAULT_IMAGE_URL);
        else {
            for (const photo of photos) {
                const imageUrl = await this.uploadToCloudinary(photo);
                skatepark.photoNames.push(imageUrl);
            }
        }

        await skatepark.save();
        
        // Invalidate relevant caches
        this.invalidateCache();
        
        return await this.getOneSkatepark(skatepark._id?.toString() || "");
    }

    // Helper method to invalidate caches when data changes
    private invalidateCache(): void {
        cache.delete(cacheKeys.allSkateparks());
        cache.delete(cacheKeys.totalCount());
        
        // Clear paginated caches (we could be more specific, but this is safer)
        const stats = cache.getStats();
        stats.keys.forEach(key => {
            if (key.includes('skateparks:paginated') || key.includes('skateparks:recent') || key.includes('skateparks:toprated')) {
                cache.delete(key);
            }
        });
    }


    public async addMultipleSkateparks(
        parksData: CreateSkateparkRequest[],
        photos: UploadedFile[],
        photoCounts: number[],
        userId: string
    ): Promise<ISkateparkModel[]> {
        if (parksData.length !== photoCounts.length) {
            throw new BadRequestError("Mismatch between parks and photo counts.");
        }

        const createdParks: ISkateparkModel[] = [];
        let photoIndex = 0;

        for (let i = 0; i < parksData.length; i++) {
            const parkData = parksData[i];
            const photoCount = photoCounts[i];

            const lon = Number(parkData.location?.coordinates?.[0]);
            const lat = Number(parkData.location?.coordinates?.[1]);

            if (isNaN(lat) || isNaN(lon)) {
                throw new BadRequestError(`Invalid coordinates for park "${parkData.title}"`);
            }

            const existing = await SkateparkModel.findOne({
                "location.coordinates": [lon, lat]
            });
            if (existing) {
                throw new BadRequestError(`A skatepark already exists at location for park ${i + 1}.`);
            }

            const parkPhotos = photos.slice(photoIndex, photoIndex + photoCount);
            photoIndex += photoCount;

            const skatepark = new SkateparkModel({
                title: parkData.title,
                description: parkData.description,
                tags: parkData.tags,
                location: {
                    type: "Point",
                    coordinates: [lon, lat]
                },
                size: parkData.size,
                levels: parkData.levels,
                isPark: parkData.isPark,
                rating: [],
                createdBy: userId,
                externalLinks: parkData.externalLinks || [],
                reports: [],
                photoNames: []
            });

            if (!parkPhotos || parkPhotos.length === 0) {
                skatepark.photoNames.push(DEFAULT_IMAGE_URL);
            } else {
                for (const photo of parkPhotos) {
                    const imageUrl = await this.uploadToCloudinary(photo);
                    skatepark.photoNames.push(imageUrl);
                }
            }

            await skatepark.save();
            createdParks.push(await this.checkSkatepark(skatepark._id?.toString() || ""));
        }

        return createdParks;
    }

    public async rateSkatepark(parkId: string, userId: string, rating: number): Promise<string> {
        if (rating < 1 || rating > 5) throw new BadRequestError("Rating must be between 1 and 5.");

        const skatepark = await this.checkSkatepark(parkId);

        const existingRating = skatepark.rating.find(r => r.userId?.toString() === userId);

        if (existingRating) {
            existingRating.value = rating;
        } else {
            skatepark.rating.push({ userId, value: rating }); ``
        }

        // Recalculate average rating
        const total = skatepark.rating.reduce((sum: number, r: { value: number }) => sum + r.value, 0);
        skatepark.avgRating = total / skatepark.rating.length;

        await skatepark.save();
        return "Skatepark rated successfully.";
    }


    public async reportSkatepark(parkId: string, userId: string, reason: string): Promise<string> {
        const skatepark = await this.checkSkatepark(parkId);

        const alreadyReported = skatepark.reports?.some(r => r.reportedBy?.toString() === userId);
        if (alreadyReported) throw new BadRequestError("User already reported this park.");

        const now = new Date();
        const createdAt = new Date(`${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);

        const report: IReport = {
            reportedBy: userId,
            reason: reason,
            createdAt: createdAt
        };

        if (!skatepark.reports) skatepark.reports = [];
        skatepark.reports.push(report);
        await skatepark.save();

        return "Report submitted successfully.";
    }

    public async updateSkatepark(
        parkId: string,
        newSkateparkData: Partial<ISkateparkModel> & { keepPhotoNames?: string[] },
        photos?: UploadedFile[]
    ): Promise<ISkateparkModel> {
        const skatepark = await this.checkSkatepark(parkId);
        const keep = newSkateparkData.keepPhotoNames ?? [];

        // Filter out images not in the keep list
        skatepark.photoNames = skatepark.photoNames.filter(name => keep.includes(name));

        // Upload new photos (if any) to Cloudinary
        if (photos && photos.length > 0) {
            for (const photo of photos) {
                const imageUrl = await this.uploadToCloudinary(photo);
                skatepark.photoNames.push(imageUrl);
            }
        }

        // Update other fields except keepPhotoNames
        for (const key in newSkateparkData) {
            if (key !== "keepPhotoNames") {
                (skatepark as any)[key] = (newSkateparkData as any)[key];
            }
        }

        // Recalculate avgRating
        if (skatepark.rating.length > 0) {
            const total = skatepark.rating.reduce((sum, r) => sum + (r.value || 0), 0);
            skatepark.avgRating = total / skatepark.rating.length;
        } else {
            skatepark.avgRating = 0;
        }

        await skatepark.save();
        return skatepark;
    }

    public async patchTagsOrLinks(parkId: string, tags?: string[], links?: ExternalLinks[]): Promise<ISkateparkModel> {
        const skatepark = await this.checkSkatepark(parkId);

        if (tags && tags.length > 0) {
            if (!skatepark.tags) skatepark.tags = [];
            const newTags = tags
                .filter(tag => Object.values(Tag).includes(tag as Tag))
                .filter(tag => !(skatepark.tags || []).includes(tag as Tag));
            skatepark.tags.push(...newTags as Tag[]);
        }

        if (links && links.length > 0) {
            for (const link of links) {
                const alreadyExists = skatepark.externalLinks.some(linkItem => linkItem.url === link.url);
                if (!alreadyExists) {
                    const now = new Date();
                    skatepark.externalLinks.push({
                        url: link.url,
                        sentBy: link.sentBy,
                        sentAt: new Date(`${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
                    })
                }
            }
        }
        await skatepark.save();
        return skatepark;
    }

    // 4. Admin Panel
    public async approveSkatepark(_id: string): Promise<string> {
        const skatepark = await this.checkSkatepark(_id);
        if (skatepark.isApproved) return "This skatepark is already approved.";

        skatepark.isApproved = true;
        await skatepark.save();
        return `Skatepark ${skatepark.title} has been approved.`;
    }

    public async getUnapprovedSkateparks(): Promise<ISkateparkModel[]> {
        return await SkateparkModel.find({ isApproved: { $ne: true } });
    }
}

export const skateparkService = new SkateparkService(); 