import { Router } from "express";
import { uploadImageController, uploadVideoController } from "~/controllers/medias.controller";
import { accessTokenValidator, verifiedUserValidator } from "~/middlewares/users.middlewares";
import { wrapRequest } from "~/utils/handler";

const mediasRouter = Router();

mediasRouter.post('/upload-image',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequest(uploadImageController)
);
mediasRouter.post('/upload-video',
  accessTokenValidator,
  verifiedUserValidator,
  wrapRequest(uploadVideoController)
)

export default mediasRouter