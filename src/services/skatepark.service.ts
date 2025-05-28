import cloudinary from "@/lib/cloudinary";
import { BadRequestError, NotFoundError } from "@/types/error-models";
import { UploadedFile } from "express-fileupload";
import { ISkateparkModel, SkateparkModel } from "../models/skatepark.model";
import { Coords, ExternalLinks, IReport, Size, SkaterLevel, Tag } from "../types/enums";
import { DEFAULT_IMAGE_URL } from "../types/constants";
import "@/models/User";

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
        const match = url.match(/\/v\d+\/(.+?)\.(jpg|jpeg|png|webp)/);
        return match ? match[1] : null;
    }


    // 2. GETs:

    public async getTotalSkateparksCount(): Promise<number> {
        return SkateparkModel.countDocuments();
    }

    public async getAllSkateparks(): Promise<ISkateparkModel[]> {
        return await SkateparkModel.find().populate("externalLinks.sentBy", "name").exec();
    }


    public async getOneSkatepark(_id: string): Promise<ISkateparkModel> {
        const skatepark = await SkateparkModel.findById(_id)
            .populate("externalLinks.sentBy", "name")
            .exec();

        if (!skatepark) throw new NotFoundError(`Skatepark with _id ${_id} not found.`);
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

    public async advancedSearch(filters: {
        size?: Size;
        level?: SkaterLevel;
        tags?: Tag[];
        isPark?: boolean;
    }): Promise<ISkateparkModel[]> {
        const query: Record<string, any> = {};
        if (filters.size) query.size = filters.size;
        if (filters.level) query.level = filters.level;
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

        if (skateparks.length === 0) throw new NotFoundError(`No parks found for user with id ${userId}`);
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
    const rawParks = await SkateparkModel.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
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

    return parks;
}





    // 3. CRUDs:
    public async deleteSkatepark(_id: string): Promise<string> {
        const skatepark = await this.checkSkatepark(_id);
        const photoNames = skatepark.photoNames;

        await SkateparkModel.findByIdAndDelete(_id);

        for (const url of photoNames) {
            if (!url.includes("default-skatepark.jpg")) {
                const publicId = this.extractCloudinaryPublicId(url);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId);
                }
            }
        }

        return `Skatepark ${skatepark.title} has been deleted.`;
    }

    public async deleteMultipleParks(_idArray: string[]): Promise<string> {
        for (const _id of _idArray) {
            const skatepark = await this.checkSkatepark(_id);
            const photoUrls = await this.getPhotoNames(_id);

            await SkateparkModel.findByIdAndDelete(_id);

            for (const url of photoUrls) {
                if (!url.includes("default-skatepark.jpg")) {
                    const publicId = this.extractCloudinaryPublicId(url);
                    if (publicId) {
                        await cloudinary.uploader.destroy(publicId);
                    }
                }
            }
        }

        return `All skateparks deleted.`;
    }


    public async addSkatepark(parkData: any, photos: UploadedFile[], userId: string): Promise<ISkateparkModel> {
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
            level: parkData.level,
            isPark: parkData.isPark === true || parkData.isPark === "true",
            rating: [],
            createdBy: userId,
            externalLinks: (parkData.externalLinks || []).map((link: any) => ({
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
        return await this.getOneSkatepark(skatepark._id?.toString() || "");
    }


    public async addMultipleSkateparks(
        parksData: any[],
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
                level: parkData.level,
                isPark: parkData.isPark === true || parkData.isPark === "true",
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