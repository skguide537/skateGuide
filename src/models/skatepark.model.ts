import mongoose, { Document } from "mongoose";
import { Coords, ExternalLinks, IReport, Rating, Size, SkaterLevel, Tag } from "../types/enums";

export interface ISkateparkModel extends Document {
    title: string;
    description?: string;
    tags?: Tag[];
    location: Coords;
    size: Size;
    level: SkaterLevel;
    isPark: boolean;
    isApproved: boolean;
    rating: Rating[];
    avgRating: number;
    createdBy: mongoose.Schema.Types.ObjectId;
    externalLinks: ExternalLinks[];
    reports?: IReport[];
    photoNames: string[];
}

const SkateparkSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Missing title."],
        minlength: [2, "Name too short."],
        maxlength: [30, "Name too long."],
        trim: true
    },
    description: {
        type: String,
        maxlength: [300, "Description too long."],
        trim: true
    },
    tags: {
        type: [String],
        enum: Object.values(Tag),
        validate: [(arr: string[]) => arr.length <= 10, "Too many tags."],
        default: []
    },
    location: {
        type: { type: String, enum: ["Point"], required: true },
        coordinates: { type: [Number], required: true }
    },
    size: {
        type: String,
        required: [true, "Missing size."],
        enum: Object.values(Size)
    },
    level: {
        type: String,
        required: [true, "Missing level."],
        enum: Object.values(SkaterLevel)
    },
    isPark: {
        type: Boolean,
        required: [true, "Missing if park or street."]
    },
    isApproved: { type: Boolean, default: false },
    rating: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        value: { type: Number, min: 1, max: 5, required: true }
    }],
    avgRating: {
        type: Number,
        default: 0
    },    
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Missing creator _id."]
    },
    externalLinks: {
        type: [{
            sentBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
            sentAt: { type: Date, default: Date.now },
            url: {
                type: String,
                required: true,
                match: [/^https?:\/\/.+/, "Invalid URL."]
            }
        }],
        validate: {
            validator: function (arr: any[]) {
                const urls = arr.map(link => link.url);
                return new Set(urls).size === urls.length && urls.length <= 10;
            },
            message: "Each link must be unique. Max 10 links allowed."
        },
        default: []
    },
    reports: {
        type: [{
            reportedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            reason: {
                type: String,
                required: true,
                maxlength: 300
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }],
        default: []
    },
    photoNames: {
        type: [String],
        required: [true, "Missing photo."]
    }
}, { versionKey: false, id: false, timestamps: true });

SkateparkSchema.index({ location: "2dsphere" });

export const SkateparkModel = mongoose.models.Skatepark || mongoose.model<ISkateparkModel>("Skatepark", SkateparkSchema);
