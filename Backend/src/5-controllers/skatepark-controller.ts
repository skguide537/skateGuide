import express, { NextFunction, Request, Response } from "express";
import { skateparkService } from "../4-services/skatepark-service";
import { StatusCode, Tag } from "../3-models/enums";
import { securityMiddleware } from "../6-middleware/security-middleware";
class SkateparkController {

    public readonly router = express.Router();

    public constructor() {
        this.router.get("/parks", securityMiddleware.validateToken, this.getAllSkateparks); //
        this.router.get("/parks/:_id([0-9a-f]{24})", securityMiddleware.validateToken, this.getOneSkatepark); //
        this.router.get("/parks/by-skater/:_id([0-9a-f]{24})", securityMiddleware.validateToken, this.getSkateparksBySkater); // 
        // this.router.get("/parks/:_id([0-9a-f]{24})/rating", securityMiddleware.validateToken, this.getSkateparkRating); //
        this.router.get("/parks/top-rated", this.getTopRatedSkateparks);  //
        this.router.get("/parks/recent/:limit(1[0-9]|20|[1-9])?", this.getRecentSkateparks); // 
        this.router.get("/parks/unapproved", securityMiddleware.validateToken, securityMiddleware.isAdmin, this.getUnapprovedSkateparks); // 
        
        
        this.router.delete("/parks/delete/:_id([0-9a-f]{24})", securityMiddleware.validateToken, securityMiddleware.isAdmin, this.deleteSkatepark); //
        this.router.delete("/parks/delete-many", securityMiddleware.validateToken, securityMiddleware.isAdmin, this.deleteMultipleSkateparks); //
        
        this.router.post("/parks/find", securityMiddleware.validateToken, this.findSkateparks);//
        this.router.post("/parks/add", securityMiddleware.validateToken, this.addSkatepark); //
        this.router.post("/parks/add-many", securityMiddleware.validateToken, this.addMultipleSkateparks); //
        this.router.post("/parks/:_id([0-9a-f]{24})/rate", securityMiddleware.validateToken, this.rateSkatepark);//
        this.router.post("/parks/:_id([0-9a-f]{24})/report", securityMiddleware.validateToken, this.reportSkatepark);

        this.router.patch("/parks/:_id([0-9a-f]{24})", securityMiddleware.validateToken, this.updateSkatepark);
        this.router.patch("/parks/:_id([0-9a-f]{24})/tags-or-links", securityMiddleware.validateToken, this.patchTagsOrLinks);

        this.router.put("/parks/:_id([0-9a-f]{24})/approve", securityMiddleware.validateToken, securityMiddleware.isAdmin, this.approveSkatepark); //

        this.router.post("/parks/nearby", securityMiddleware.validateToken, this.getSkateparksNearLocation);
        this.router.post("/parks/search", securityMiddleware.validateToken, this.advancedSearch);
        this.router.post("/parks/by-tags", securityMiddleware.validateToken, this.getSkateparksByTags);


    }

    // 1. Gets:

    private async getAllSkateparks(request: Request, response: Response, next: NextFunction) {
        try {
            response.status(StatusCode.OK).json(await skateparkService.getAllSkateparks())
        } catch (err: any) { next(err); }
    }

    private async getOneSkatepark(request: Request, response: Response, next: NextFunction) {
        try {
            const _id = request.params._id;
            response.json(await skateparkService.getOneSkatepark(_id));
        } catch (err: any) { next(err); }
    }

    private async findSkateparks(request: Request, response: Response, next: NextFunction) {
        try {
            const partialData = request.body;
            const skateparks = await skateparkService.findSkateparks(partialData);
            response.status(StatusCode.OK).json(skateparks);
        } catch (err: any) { next(err); }
    }

    private async advancedSearch(request: Request, response: Response, next: NextFunction) {
        try {
            const filters = request.body; // expect body to include size, level, tags, isPark
            const parks = await skateparkService.advancedSearch(filters);
            response.status(StatusCode.OK).json(parks);
        } catch (err: any) {
            next(err);
        }
    }

    private async getSkateparksBySkater(request: Request, response: Response, next: NextFunction) {
        try {
            const _id = request.params._id;
            const skateparks = await skateparkService.getSkateparksBySkater(_id);
            response.status(StatusCode.OK).json(skateparks)

        } catch (err: any) { next(err); }
    }

    private async getSkateparksNearLocation(request: Request, response: Response, next: NextFunction) {
        try {
            const { latitude, longitude, radiusKm } = request.body;
            const coords = { latitude, longitude };
            const parks = await skateparkService.getSkateparksNearLocation(coords, radiusKm);
            response.status(StatusCode.OK).json(parks);
        } catch (err: any) { next(err); }
    }

    // private async getSkateparkRating(request: Request, response: Response, next: NextFunction) {
    //     try {
    //         const _id = request.params._id;
    //         const skateparkRating = await skateparkService.getSkateparkRating(_id);
    //         response.status(StatusCode.OK).json(skateparkRating);
    //     } catch (err: any) { next(err); }
    // }

    private async getTopRatedSkateparks(request: Request, response: Response, next: NextFunction) {
        try {
            const limit = request.query.limit ? +request.query.limit : undefined;
            const parks = await skateparkService.getTopRatedSkateparks(limit);
            response.status(StatusCode.OK).json(parks);
        } catch (err: any) {
            next(err);
        }
    }

    private async getSkateparksByTags(request: Request, response: Response, next: NextFunction) {
        try {
            const tags = request.body.tags as Tag[];
            const parks = await skateparkService.getSkateparksByTags(tags);
            response.status(StatusCode.OK).json(parks);
        } catch (err: any) { next(err); }
    }

    private async getRecentSkateparks(request: Request, response: Response, next: NextFunction) {
        try {
            const limit = request.params.limit ? +request.params.limit : 3;
            const skateparks = await skateparkService.getRecentSkateparks(limit);
            response.status(StatusCode.OK).json(skateparks);
        } catch (err: any) { next(err); }
    }


    // 2. CRUDs:

    private async deleteSkatepark(request: Request, response: Response, next: NextFunction) {
        try {
            const _id = request.params._id;
            const result = await skateparkService.deleteSkatepark(_id);
            response.status(StatusCode.OK).json(result);
        } catch (err: any) { next(err); }
    }

    private async deleteMultipleSkateparks(request: Request, response: Response, next: NextFunction) {
        try {
            const _idArray: string[] = request.body._idArray;
            if (!Array.isArray(_idArray) || _idArray.length === 0) return response.status(StatusCode.BadRequest).send("Missing or invalid _id array.");
            const result = await skateparkService.deleteMultipleParks(_idArray);
            response.status(StatusCode.OK).json(result);
        } catch (err: any) { next(err); }
    }

    private async addSkatepark(request: Request, response: Response, next: NextFunction) {
        try {
            const files = request.files?.photos;

            if (!files || (Array.isArray(files) && files.length === 0))
                return response.status(StatusCode.BadRequest).send("Missing photo files in form-data.");

            const parkData = request.body;
            parkData.tags = JSON.parse(parkData.tags);
            parkData.location = {
                latitude: +request.body["location[latitude]"],
                longitude: +request.body["location[longitude]"]
            };
            const createdBy = parkData.createdBy; // Or extract from JWT if you're storing user data on the request
            const photos = Array.isArray(files) ? files : [files]; // Normalize single vs multiple uploads

            const skatepark = await skateparkService.addSkatepark(parkData, photos, createdBy);
            response.status(StatusCode.Created).json(skatepark);

        } catch (err: any) { next(err); }
    }

    private async addMultipleSkateparks(request: Request, response: Response, next: NextFunction) {
        try {
            const parksData = JSON.parse(request.body.parksData);
            const photoCounts = JSON.parse(request.body.photoCounts);
            const createdBy = request.body.createdBy;
            const photos = Array.isArray(request.files?.photos) ? request.files.photos : [request.files?.photos];
    
            for (const park of parksData) {
                const latitude = park.location?.latitude;
                const longitude = park.location?.longitude;
            
                park.location = {
                    type: "Point",
                    coordinates: [longitude, latitude]
                };
            
                park.createdBy = createdBy;
            }            
    
            const newParks = await skateparkService.addMultipleSkateparks(parksData, photos, photoCounts, createdBy);
            response.status(StatusCode.Created).json(newParks);
        } catch (err: any) {
            next(err);
        }
    }
    
    private async rateSkatepark(request: Request, response: Response, next: NextFunction) {
        try {
            const { _id } = request.params;
            const { userId, rating } = request.body;
            const result = await skateparkService.rateSkatepark(_id, userId, rating);
            response.status(StatusCode.OK).json(result);
        } catch (err: any) { next(err); }
    }

    private async reportSkatepark(request: Request, response: Response, next: NextFunction) {
        try {
            const { _id } = request.params;
            const { userId, reason } = request.body;
            const result = await skateparkService.reportSkatepark(_id, userId, reason);
            response.status(StatusCode.OK).json(result);
        } catch (err: any) { next(err); }
    }

    private async updateSkatepark(request: Request, response: Response, next: NextFunction) {
        try {
            const parkId = request.params._id;
            const photos = Array.isArray(request.files?.photos) ? request.files.photos : [request.files?.photos];
            const parkData = request.body;
    
            if (parkData.keepPhotoNames) parkData.keepPhotoNames = JSON.parse(parkData.keepPhotoNames);
            if (parkData.tags) parkData.tags = JSON.parse(parkData.tags);
    
            const updated = await skateparkService.updateSkatepark(parkId, parkData, photos[0] ? photos : undefined);
            response.status(StatusCode.OK).json(updated);
        } catch (err: any) { next(err); }
    }

    private async patchTagsOrLinks(request: Request, response: Response, next: NextFunction) {
        try {
            const parkId = request.params._id;
            const { tags, externalLinks } = request.body;
            const parsedTags = tags ? JSON.parse(tags) : undefined;
            const parsedLinks = externalLinks ? JSON.parse(externalLinks) : undefined;
    
            const updated = await skateparkService.patchTagsOrLinks(parkId, parsedTags, parsedLinks);
            response.status(StatusCode.OK).json(updated);
        } catch (err: any) { next(err); }
    }

    // 3. Admin Panel:

    private async approveSkatepark(request: Request, response: Response, next: NextFunction) {
        try {
            const _id = request.params._id;
            const result = await skateparkService.approveSkatepark(_id);
            response.status(StatusCode.OK).json(result);
        } catch (err: any) { next(err); }
    }

    private async getUnapprovedSkateparks(request: Request, response: Response, next: NextFunction) {
        try {
            const parks = await skateparkService.getUnapprovedSkateparks();
            response.status(StatusCode.OK).json(parks);
        } catch (err: any) { next(err); }
    }


}

export const skateparkController = new SkateparkController();