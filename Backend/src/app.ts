import cors from "cors";
import express, { Express } from "express";
import { appConfig } from "./2-utils/app-config";
import { userController } from "./5-controllers/user-controller";
import { errorMiddleware } from "./6-middleware/error-middleware";
import { dal } from "./2-utils/dal";
import fileUpload from "express-fileupload";
import path from "path";
import { fileSaver } from "uploaded-file-saver";
import { authController } from "./5-controllers/auth-controller";
import { securityMiddleware } from "./6-middleware/security-middleware";
import { skateparkController } from "./5-controllers/skatepark-controller";


class App {

    public server: Express; // Make server public for the testing.

    public async start(): Promise<void> {

        // Create the server: 
        this.server = express();

        this.server.use(cors()); // Enabling CORS for any frontend address.

        // Tell express to create a request.body object from the body json:
        this.server.use(express.json());

        // Image Handling
        this.server.use(fileUpload());

        const photosBasePath = path.join(__dirname, "1-assets", "photos");
        // console.log(`1: Photo Base Path: ${photosBasePath}`);
        fileSaver.config(photosBasePath);

        const userPhotosPath = path.join(photosBasePath, "profile-pictures");
        // console.log(`2: User Photo Path: ${userPhotosPath}`);
        const parkPhotosPath = path.join(photosBasePath, "skateparks");
        // console.log(`3: Parks Photo Path: ${parkPhotosPath}`);
        this.server.use("/api/users/images", express.static(userPhotosPath));
        this.server.use("/api/parks/images", express.static(parkPhotosPath));


        this.server.use(securityMiddleware.preventXssAttack);

        // Connect controllers to the server:
        this.server.use("/api", userController.router);
        this.server.use("/api", authController.router);
        this.server.use("/api", skateparkController.router);

        // Register route not found middleware: 
        this.server.use("*", errorMiddleware.routeNotFound);

        // Register catch-all middleware: 
        this.server.use(errorMiddleware.catchAll);

        await dal.connect();

        this.server.listen(appConfig.port, () => console.log("Listening on http://localhost:" + appConfig.port));
    }

}

export const app = new App(); // export app for the testing.
app.start();

