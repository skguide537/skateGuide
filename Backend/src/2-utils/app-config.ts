import dotenv from "dotenv";

// Load ".env" file into process.env object:
dotenv.config();

class AppConfig {

    public readonly isDevelopment = process.env.ENVIRONMENT === "development";
    public readonly isProduction = process.env.ENVIRONMENT === "production";
    public readonly port = +process.env.PORT;

    public readonly mongoConnectionString = process.env.MONGODB_CONNECTION_STRING;

    public readonly jwtSecret = process.env.JWT_SECRET;
    public readonly passwordSalt = process.env.SALT;

}

export const appConfig = new AppConfig();


// 1. when the user registers, a new credentials object needs to be stored in the db, containing the hashed password, the email, and the matching _id.
// 2. next time when this user logs in, the object is already stored in the db. if the email and password matching, you are good to go.