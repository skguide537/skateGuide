import * as crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { ICredentialsModel } from "../3-models/credentials-model";
import { appConfig } from "./app-config";
import { userService } from "../4-services/user-service";
import { Role } from "../3-models/enums";



class Cyber {

    public hash(plainText: string): string {
        if (!plainText) return null;
        const salt = appConfig.passwordSalt;
        return crypto.createHmac("sha512", salt)
            .update(plainText)
            .digest("hex")

    }

    public getNewToken(credentials: ICredentialsModel): string {
        delete credentials.password;
        delete credentials._id;
        const payload = { credentials };
        const options: SignOptions = { expiresIn: "3h" };
        const token = jwt.sign(payload, appConfig.jwtSecret, options);
        return token;
    }

    public validateToken(token: string): boolean {
        try {
            if (!token) return false;
            jwt.verify(token, appConfig.jwtSecret);
            return true;
        } catch { return false; }
    }

    public async isAdmin(token: string): Promise<boolean> {
        try {
            const decodedToken: any = jwt.verify(token, appConfig.jwtSecret);
            const user = await userService.checkUser(decodedToken.credentials.userId);
            return user.role === Role.Admin;
        } catch (err) {
            console.error("Token verification failed or user not found:", err);
            return false;
        }
    }

}

export const cyber = new Cyber();