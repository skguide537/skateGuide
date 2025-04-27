import mongoose from "mongoose";
import { ISkateparkModel } from "./skatepark-model";

export enum StatusCode {
    OK = 200,
    Created = 201,
    NoContent = 204,
    BadRequest = 400,
    Unauthorized = 401,
    Forbidden = 403,
    NotFound = 404,
    InternalServerError = 500
}

export enum Role {
    Admin = "Admin",
    User = "User",
    Guest = "Guest"
}

export enum SkaterLevel {
    Beginner = "Beginner",
    Intermediate = "Intermediate",
    Expert = "Expert"
}

export enum Size {
    Tiny = "Tiny",
    Small = "Small",
    Medium = "Medium",
    Large = "Large",
    Huge = "Huge"
}

export interface IReport {
    reportedBy: string;
    reason: string;
    createdAt: Date;
}


export class Rating {
    userId: string;
    value: number
}

export class Coords {
    latitude: number;
    longitude: number;
}

export class ExternalLinks {
    sentBy: string;
    sentAt: Date;
    url: string;
}

export enum Tag {
    Rail = "Rail",
    Ledge = "Ledge",
    Stairs = "Stairs",
    ManualPad = "Manual Pad",
    Bank = "Bank",
    QuarterPipe = "Quarter Pipe",
    HalfPipe = "Half Pipe",
    Bowl = "Bowl",
    Pool = "Pool",
    Pyramid = "Pyramid",
    Hubba = "Hubba",
    Flatbar = "Flatbar",
    Kicker = "Kicker",
    Spine = "Spine",
    Funbox = "Funbox",
    DIY = "DIY"
}


