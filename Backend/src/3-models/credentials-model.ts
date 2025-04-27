import { Document, model, Schema, Types } from "mongoose";

export interface ICredentialsModel extends Document {
    email: string;
    password: string;
    userId: Types.ObjectId;
}

export const CredentialsSchema = new Schema<ICredentialsModel>({
    email: {
            type:String,
            required: [true, "Email required."],
            minlength: [6, "Email too Short."],
            maxlength: [100, "Email too long"],
            trim: true, unique:true,
            match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/,
            "Invalid email format"]
    },
    password: {
        type:String,
        required:[true,"Missing password."],
        minlength:[4,"Password too short."],
        maxlength:[200, "Password too long."]
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: false,
        ref:"User"
    }
},{versionKey:false,id:false});

export const CredentialsModel = model<ICredentialsModel>("CredentialsModel",CredentialsSchema,"credentials");