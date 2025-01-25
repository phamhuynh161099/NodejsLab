import { Router } from "express";
import { serveImageController, serveVideoController, serveVideoStreamController } from "~/controllers/medias.controller";

const staticRoute = Router();

staticRoute.get('/image/:name', serveImageController)
staticRoute.get('/video-stream/:name', serveVideoStreamController)

export default staticRoute