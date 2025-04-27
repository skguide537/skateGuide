import { NextFunction, Request, Response } from "express";
import { cyber } from "../2-utils/cyber";
import { ForbiddenError, UnauthorizedError } from "../3-models/error-models";
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { appConfig } from "../2-utils/app-config";
import striptags from "striptags";
import { userService } from "../4-services/user-service";

class SecurityMiddleware {

    public async validateToken(request: Request, response: Response, next: NextFunction) {

        const header = request.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.substring(7) : header;
        if (!token || !cyber.validateToken(token)) return next(new UnauthorizedError("You are not logged-in."));

        try {
            const payload: any = jwt.verify(token, appConfig.jwtSecret);
            request.user = { _id: payload.credentials?.userId };
            next();

        } catch (error: any) {
            if (error instanceof TokenExpiredError) {
                const decoded: any = jwt.decode(token);
                const userId = decoded?.credentials?.userId;

                if (userId) {
                    const user = await userService.getOneUser(userId);
                    user.isActive = false;
                    await user.save();
                }
                return next(new UnauthorizedError("Session expired."));
            }

            return next(new UnauthorizedError("Invalid token."));
        }
    }


    public isAdmin(request: Request, response: Response, next: NextFunction): void {
        const header = request.headers.authorization;
        const token = header?.substring(7);

        if (!cyber.isAdmin(token)) {
            next(new ForbiddenError("You are unauthorized"));
            return;
        }
        next();
    }

    public preventXssAttack(request: Request, response: Response, next: NextFunction): void {
        for (const prop in request.body) {
            const value = request.body[prop];
            if (typeof value === 'string') request.body[prop] = striptags(value);
        }
        next();

    }

}

export const securityMiddleware = new SecurityMiddleware();

declare module "express" { interface Request { user?: { _id: string; }; } }