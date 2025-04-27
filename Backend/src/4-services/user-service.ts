import "../3-models/skatepark-model";
import { UploadedFile } from "express-fileupload";
import mongoose from "mongoose";
import { fileSaver } from "uploaded-file-saver";
import { cyber } from "../2-utils/cyber";
import { CredentialsModel } from "../3-models/credentials-model";
import { Role } from "../3-models/enums";
import { BadRequestError, NotFoundError } from "../3-models/error-models";
import { ISkateparkModel } from "../3-models/skatepark-model";
import { IUserModel, UserModel } from "../3-models/user-model";
import path from "path";



class UserService {

    // 1. Helper Functions:

    public async checkUser(_id: string): Promise<IUserModel> {
        const user = await UserModel.findById(_id);
        if (!user) throw new NotFoundError(`User with _id ${_id} not found.`);
        return user;
    }

    protected async getPhotoName(_id: string): Promise<string> {
        const user = await this.checkUser(_id);
        return user.photoName;
    }

    // 2. GETs:

    public async getAllUsers(): Promise<IUserModel[]> { return UserModel.find(); }

    public async getOneUser(_id: string): Promise<IUserModel> {
        const user = this.checkUser(_id);
        return user;
    }

    public async getActiveUsers(): Promise<IUserModel[]> {
        const activeUsers = UserModel.find({ isActive: true });
        if (!activeUsers) throw new NotFoundError(`No active users found.`);
        return activeUsers;
    }

    public async findUsers(partialData: Partial<IUserModel>): Promise<IUserModel[]> {

        const query = {};
        for (const key in partialData) {
            const value = partialData[key as keyof IUserModel];

            if (typeof value === "string") query[key] = { $regex: value, $options: "i" };
            else query[key] = value;
        }
        const users = await UserModel.find(query);
        if (users.length === 0) throw new NotFoundError(`No Users Found on those search terms.`);
        return users;

    }

    public async getFavorites(userId: string): Promise<ISkateparkModel[]> {
        const user = await UserModel.findById(userId).populate("favorites");
        if (!user) throw new NotFoundError(`User with id ${userId} not found.`);
        return user.favorites as unknown as ISkateparkModel[];
    }


    // 3. CRUDs:

    public async deleteUser(_id: string): Promise<string> {
        const user = await this.checkUser(_id);
        const photoName = user.photoName;
        await UserModel.findByIdAndDelete(_id);
        await fileSaver.delete("profile-pictures/" + photoName);
        await CredentialsModel.findByIdAndDelete(_id);
        return `User with id ${_id} has been deleted.`;
    }

    public async deleteMultipleUsers(_idArray: string[]): Promise<string> {
        for (let _id of _idArray) {
            const user = await this.checkUser(_id);
            const photoName = await this.getPhotoName(_id);
            await UserModel.findByIdAndDelete(_id);
            await fileSaver.delete("profile-pictures/" + photoName);
            await CredentialsModel.findByIdAndDelete(_id);
        }
        return `All users deleted.`;
    }

    public async addUser(userData: any, photo: UploadedFile): Promise<IUserModel> {
        const user = new UserModel({
            name: userData.name,
            age: +userData.age,
            isActive: userData.isActive === true || userData.isActive === "true",
            role: userData.role
        });

        const savedFileName = await fileSaver.add(photo, "profile-pictures");
        const fullPath = path.join(__dirname, "..", "1-assets", "photos", "profile-pictures", savedFileName);
        console.log("Full saved path:", fullPath);
        user.photoName = savedFileName;

        if (!user.photoName) throw new BadRequestError("Photo file could not be processed.");

        BadRequestError.validateSync(user);
        await user.save();

        const dbUser = await this.checkUser(user._id.toString());

        const credentials = new CredentialsModel({
            userId: dbUser._id,
            email: userData.email,
            password: cyber.hash(userData.password)
        });

        BadRequestError.validateSync(credentials);
        await credentials.save();

        return this.getOneUser(user._id.toString());
    }


    public async addMultipleUsers(usersDataArr: IUserModel[], photos: UploadedFile[]): Promise<IUserModel[]> {
        const createdUsers: IUserModel[] = [];


        for (let i = 0; i < usersDataArr.length; i++) {
            const userData = usersDataArr[i];
            const photo = photos[i];

            const user = new UserModel({
                name: userData.name,
                age: +userData.age,
                isActive: userData.isActive === true,
                role: userData.role
            });

            user.photoName = await fileSaver.add(photo, "profile-pictures");
            BadRequestError.validateSync(user);
            await user.save();

            const credentials = new CredentialsModel({
                _id: user._id,
                userId: user._id,
                email: (userData as any).email,
                password: cyber.hash((userData as any).password)
            })

            BadRequestError.validateSync(credentials);
            await credentials.save();

            createdUsers.push(user);
        }
        return createdUsers;

    }

    public async updateUser(_id: string, newUserData: Partial<IUserModel>, photo?: UploadedFile): Promise<IUserModel> {
        const user = await this.checkUser(_id);
        Object.assign(user, newUserData);

        if (photo) {
            if (user.photoName) await fileSaver.delete("profile-pictures/" + user.photoName);
            user.photoName = await fileSaver.add(photo, "profile-pictures");
        }

        BadRequestError.validateSync(user);
        await user.save();
        return await this.checkUser(_id);
    }

    public async updateUserRole(_id: string, newRole: Role): Promise<string> {
        const user = await UserModel.findById(_id);
        if (user.role === newRole) return `User ${user.name} is already ${user.role}.`
        user.role = newRole;
        await user.save();
        return `User ${user.name} has changed roles to ${user.role}`;
    }

    public async toggleFavorite(userId: string, parkId: string): Promise<string> {
        const user = await this.checkUser(userId);
        const index = user.favorites.findIndex(id => id.toString() === parkId);

        if (index >= 0) {
            user.favorites.splice(index, 1);
            await user.save();
            return "Removed from favorites.";
        } else {
            user.favorites.push(new mongoose.Types.ObjectId(parkId));
            await user.save();
            return "Added to favorites.";
        }
    }

    // 4. Other:

    public async toggleActivity(_id: string): Promise<string> {
        const user = await UserModel.findById(_id);
        user.isActive = !user.isActive;
        await user.save();
        return `User ${user.name} is now ${user.isActive ? "active" : "inactive"}.`;
    }

}

export const userService = new UserService();
