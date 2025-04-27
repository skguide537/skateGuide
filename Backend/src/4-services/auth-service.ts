import { UserModel } from './../3-models/user-model';
import mongoose from "mongoose";
import { cyber } from "../2-utils/cyber";
import { CredentialsModel, ICredentialsModel } from "../3-models/credentials-model";
import { Role } from "../3-models/enums";
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from "../3-models/error-models";
import { userService } from "./user-service";

class AuthenticationService {

    protected async checkCredentials(email: string, password: string): Promise<ICredentialsModel> {
        const credentials = await CredentialsModel.findOne({ email: email, password: password });
        if (!credentials) throw new NotFoundError(`Email or password are incorrect.`);
        return credentials;
    }


    public async login(credentials: ICredentialsModel): Promise<string> {
        const credentialsDoc = new CredentialsModel(credentials);
        BadRequestError.validateSync(credentialsDoc);
        const hashedPassword = cyber.hash(credentials.password)
        const dbCredentials = await this.checkCredentials(credentials.email, hashedPassword);
        const token = cyber.getNewToken(dbCredentials.toObject());
        const user = await userService.getOneUser(dbCredentials.userId.toString());
        user.isActive = true;
        await user.save();

        return token;
    }

    public async logout(requesterId: string, targetUserId: string): Promise<string> {
        if (requesterId !== targetUserId) throw new ForbiddenError("You can only logout yourself.");
        const user = await userService.getOneUser(targetUserId);
        user.isActive = false;
        await user.save();

        return `User ${user.name} has logged out.`;
    }


    public async changePassword(requesterId: string, currentPassword: string, newPassword: string, targetUserId?: string): Promise<string> {
        const requester = await userService.getOneUser(requesterId);
        const targetId = requester.role === Role.Admin && targetUserId ? targetUserId : requesterId;
        const credentials = await CredentialsModel.findOne({ userId: new mongoose.Types.ObjectId(targetId) });
        if (!credentials) throw new NotFoundError("Credentials not found.");
        if (requester.role !== Role.Admin) {
            const hashed = cyber.hash(currentPassword);
            if (credentials.password !== hashed) throw new UnauthorizedError("Current password is incorrect.");
        }
        credentials.password = cyber.hash(newPassword);
        await credentials.save();
        return requester.role === Role.Admin ? `Password updated for user ${targetId}` : "Password changed successfully.";
    }

}

export const authService = new AuthenticationService();