import { appConfig } from "./app-config";
import mongoose from "mongoose";

class DAL {
    public async connect() {
        const db = await mongoose.connect(appConfig.mongoConnectionString);
        console.log("We're connected to MongoDB " + db.connections[0].name);
    }
}

export const dal = new DAL();
