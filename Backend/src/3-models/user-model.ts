import mongoose from "mongoose";
import { Role } from "./enums";
import { Document } from "mongoose";


export interface IUserModel extends Document {
    name: string;
    age: number;
    isActive: boolean;
    role: Role;
    photoName: string;
    favorites: mongoose.Types.ObjectId[]; // favorite skateparks array
}

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Missing name."],
        minlength: [2, "Name too Short."],
        maxlength: [25, "Name too long."],
        trim: true
    },
    age: {
        type: Number,
        required: [true, "Missing age."],
        max: [100, "Your'e too old."],
        min: [0, "Your'e too Young."]

    },
    isActive: {
        type: Boolean,
        required: [true, "Missing active status."]
    },
    role: {
        type: String,
        required: [true, "Missing role."],
        enum: Object.values(Role),
        default: Role.User
    },
    favorites: {
        type: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Skatepark"
            }
        ],
        default: []
    },
    photoName: {
        type: String,
        required: [true, "Missing photo."]
    },


}, { versionKey: false, id: false, timestamps: true });

export const UserModel = mongoose.model<IUserModel>("User", UserSchema);