import express, { NextFunction, Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import { StatusCode } from "../3-models/enums";
import { userService } from "../4-services/user-service";
import { securityMiddleware } from "../6-middleware/security-middleware";

class UserController {

    public readonly router = express.Router();

    public constructor() {
        this.router.get("/users", securityMiddleware.validateToken, this.getAllUsers);
        this.router.get("/users/:_id([0-9a-f]{24})", securityMiddleware.validateToken, this.getOneUser);
        this.router.get("/users/active", securityMiddleware.validateToken, this.getActiveUsers);
        this.router.get("/users/:_id([0-9a-f]{24})/favorites", securityMiddleware.validateToken, this.getFavorites);

        this.router.delete("/users/:_id([0-9a-f]{24})", securityMiddleware.validateToken, securityMiddleware.isAdmin, this.deleteUser);
        this.router.delete("/users/delete-many", securityMiddleware.validateToken, securityMiddleware.isAdmin, this.deleteMultipleUsers);

        this.router.post("/users/add", this.addUser);
        this.router.post("/users/add-many", securityMiddleware.validateToken, securityMiddleware.isAdmin, this.addMultipleUsers);
        this.router.post("/users/find", securityMiddleware.validateToken, this.findUsers);

        this.router.put("/users/:_id([0-9a-f]{24})/role", securityMiddleware.validateToken, securityMiddleware.isAdmin, this.updateUserRole);
        this.router.put("/users/:_id([0-9a-f]{24})/update", securityMiddleware.validateToken, this.updateUser);
        
        this.router.patch("/users/:_id([0-9a-f]{24})/favorites/:parkId([0-9a-f]{24})", securityMiddleware.validateToken, this.toggleLike);
        this.router.patch("/users/:_id([0-9a-f]{24})", securityMiddleware.validateToken, securityMiddleware.isAdmin, this.toggleActivity);
    }


    // 1.GETs:

    private async getAllUsers(request: Request, response: Response, next: NextFunction) {
        try {
            const users = await userService.getAllUsers();
            response.json(users);
        } catch (err: any) { next(err); }
    }

    private async getOneUser(request: Request, response: Response, next: NextFunction) {
        try {
            const _id = request.params._id;
            const user = await userService.getOneUser(_id);
            response.json(user);
        } catch (err: any) { next(err); }
    }

    private async getActiveUsers(request: Request, response: Response, next: NextFunction) {
        try {
            const activeUsers = await userService.getActiveUsers();
            response.json(activeUsers);
        } catch (err: any) { next(err); }
    }

    private async findUsers(request: Request, response: Response, next: NextFunction) {
        try {
            const partialData = request.body;
            const users = await userService.findUsers(partialData);
            response.status(StatusCode.OK).json(users);
        } catch (err: any) { next(err); }
    }

    private async getFavorites(request: Request, response: Response, next: NextFunction) {
        try {
            const _id = request.params._id;
            const favorites = await userService.getFavorites(_id);
            response.status(StatusCode.OK).json(favorites);
        } catch (err: any) { next(err); }
    }
    



    // 2.CRUDs:

    private async addUser(request: Request, response: Response, next: NextFunction) {
        try {
            if (!request.files || !request.files.photo)
                return response.status(StatusCode.BadRequest).send("Missing photo file in form-data.");

            const userData = request.body;
            const photo = request.files.photo as UploadedFile;

            const dbUser = await userService.addUser(userData, photo);
            response.status(StatusCode.Created).json(dbUser);

        } catch (err: any) { next(err); }
    }

    private async addMultipleUsers(request: Request, response: Response, next: NextFunction) {
        try {
            const usersDataArr = JSON.parse(request.body.users);
            const photos = Array.isArray(request.files.photo) ? request.files.photo : [request.files.photo];
            const createdUsers = await userService.addMultipleUsers(usersDataArr, photos);
            response.status(StatusCode.Created).json(createdUsers);

        } catch (err: any) { next(err); }
    }

    public async updateUser(request: Request, response: Response, next: NextFunction) {
        try {
            const newUserData = request.body;
            const _id = request.params._id;
            const photo = request.files?.photo;
            if (!photo && !request.files) return response.status(StatusCode.BadRequest).send("Missing Photo in form-data.")
            const user = await userService.updateUser(_id, newUserData, photo as UploadedFile);
            response.status(StatusCode.OK).json(user);

        } catch (err: any) { next(err); }

    }

    public async updateUserRole(request: Request, response: Response, next: NextFunction) {
        try {
            const { newRole } = request.body;
            const _id = request.params._id;
            const user = await userService.updateUserRole(_id, newRole);
            response.status(StatusCode.OK).json(user);

        } catch (err: any) { next(err); }

    }

    private async deleteUser(request: Request, response: Response, next: NextFunction) {
        try {
            const _id = request.params._id;
            const result = await userService.deleteUser(_id);
            response.status(StatusCode.OK).json(result);

        } catch (err: any) { next(err); }

    }

    private async deleteMultipleUsers(request: Request, response: Response, next: NextFunction) {

        try {
            const _idArray: string[] = request.body._idArray;
            if (!Array.isArray(_idArray) || _idArray.length === 0) return response.status(StatusCode.BadRequest).send("Missing or invalid _id array.");
            const result = await userService.deleteMultipleUsers(_idArray);
            response.status(StatusCode.OK).json(result);
        } catch (err: any) { next(err); }
    }

    private async toggleLike(request: Request, response: Response, next: NextFunction) {
        try {
            const userId = request.params._id;
            const parkId = request.params.parkId;
            const message = await userService.toggleFavorite(userId, parkId);
            response.status(StatusCode.OK).json(message);

        } catch (err: any) { next(err); }
    }



    // 3. Other:

    public async toggleActivity(request: Request, response: Response, next: NextFunction) {
        try {
            const _id = request.params._id;
            const result = await userService.toggleActivity(_id);
            response.status(StatusCode.OK).json(result);
        } catch (err: any) { next(err); }

    }

}

export const userController = new UserController();
