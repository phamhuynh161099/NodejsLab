import { Router } from "express";
import { emailVerifyValidator, loginController, logoutController, registerController } from "~/controllers/users.controller";
import { accessTokenValidator, emailVerifyTokenValidator, loginValidator, refreshTokenValidator, registerValidator } from "~/middlewares/users.middlewares";
import { wrapRequest } from "~/utils/handler";

const usersRouter = Router();


usersRouter.post('/login', loginValidator, wrapRequest(loginController));
usersRouter.post('/register', registerValidator, wrapRequest(registerController));
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, logoutController);


/**
 * Description. Verify email when user client click on the link in email
 * Path: /verify-email
 * Method: POST
 * Body: { email_verify_token: string }
 */
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequest(emailVerifyValidator));

export default usersRouter;