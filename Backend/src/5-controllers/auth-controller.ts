import express, { NextFunction, Request, Response } from "express";
import { authService } from "../4-services/auth-service";
import { Role, StatusCode } from "../3-models/enums";
import { securityMiddleware } from "../6-middleware/security-middleware";
import { userService } from "../4-services/user-service";

class AuthenticationController {

    public readonly router = express.Router();

    public constructor() {
        this.router.post("/users/login", this.login);
        this.router.post("/users/logout/:_id([0-9a-f]{24})",securityMiddleware.validateToken, this.logout);
        this.router.patch("/users/change-password", securityMiddleware.validateToken, this.changePassword);
    }

    private async login(request: Request, response: Response, next: NextFunction) {
        try {
            const credentials = request.body;
            const token = await authService.login(credentials);
            response.status(StatusCode.OK).json(token);
        } catch (err: any) { next(err); }
    }

    private async logout(request: Request, response: Response, next: NextFunction) {
        try {
            const requesterId = request.user._id;
            const targetUserId = request.params._id;
            const result = await authService.logout(requesterId, targetUserId);
            response.status(StatusCode.OK).json(result);
        } catch (err: any) { next(err); }
    }
    

    private async changePassword(request: Request, response: Response, next: NextFunction) {
        try {
            const requesterId = request.user._id;
            const { currentPassword, newPassword, targetUserId } = request.body;
    
            if (!newPassword) return response.status(StatusCode.BadRequest).send("Missing new password.");
    
            // Only require currentPassword if it's not an admin action:
            const isAdmin = (await userService.getOneUser(requesterId)).role === Role.Admin;
            if (!isAdmin && !currentPassword) {
                return response.status(StatusCode.BadRequest).send("Missing current password.");
            }
    
            const result = await authService.changePassword(requesterId, currentPassword, newPassword, targetUserId);
            response.status(StatusCode.OK).json(result);
    
        } catch (err: any) { next(err); }
    }
    
    


}

export const authController = new AuthenticationController();