import { Router } from "express";
import { emailVerifyController, followController, forgotPasswordController, getMeController, getProfileController, loginController, logoutController, registerController, resendEmailVerifyController, resetPasswordController, unfollowController, updateMeController, verifyForgotPasswordTokenController } from "~/controllers/users.controller";
import { filterMiddleware } from "~/middlewares/common.middleware";
import { accessTokenValidator, changePasswordValidator, emailVerifyTokenValidator, followValidator, forgotPasswordValidator, loginValidator, refreshTokenValidator, registerValidator, resetPasswordValidator, unfollowValidator, updateMeValidator, verifiedUserValidator, verifyForgotPasswordTokenValidator } from "~/middlewares/users.middlewares";
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
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequest(emailVerifyController));

/**
 * Description. Verify email when user client click on the link in email
 * Path: /resend-verify-email
 * Method: POST
 * Header: { Authorization: Bearer <access_token>}
 * Body: {}
 */
usersRouter.post('/resend-verify-email',
  accessTokenValidator,
  wrapRequest(resendEmailVerifyController)
);


/**
 * Description. Submit email to reset password, send email to user
 * Path: /forgot-password
 * Method: POST
 * Body: {email: string}
 */
usersRouter.post('/forgot-password',
  forgotPasswordValidator,
  wrapRequest(forgotPasswordController)
);

/**
 * Description. Verify link in email to reset password
 * Path: /verify-forgot-password-token
 * Method: POST
 * Body: {forgot_password_token: string}
 */
usersRouter.post('/verify-forgot-password-token',
  verifyForgotPasswordTokenValidator,
  wrapRequest(verifyForgotPasswordTokenController)
);

/**
 * Description. Reset password
 * Path: /reset-password
 * Method: POST
 * Body: {forgot_password_token: string, password: string, confirm_password: string}
 */
usersRouter.post('/reset-password',
  resetPasswordValidator,
  wrapRequest(resetPasswordController)
);


/**
 * Description. Get my profile
 * Path: /me
 * Method: GET
 * Header: { Authorization: Bearer <access_token>}
 * Body: {}
 */
usersRouter.get('/me',
  accessTokenValidator,
  wrapRequest(getMeController)
);

/**
 * Description. Update my profile
 * Path: /me
 * Method: PATCH
 * Header: { Authorization: Bearer <access_token>}
 * Body: UserInfor
 */
usersRouter.patch('/update-me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  // filterMiddleware([]),
  wrapRequest(updateMeController)
);


/**
 * Description. Get user profile
 * Path: /:username
 * Method: GET
 * Body: {}
 */
usersRouter.get('/:username',
  wrapRequest(getProfileController)
);

/**
 * Description. Follow someone
 * Path: /follow
 * Method: GET
 * Header: { Authorization: Bearer <access_token>}
 * Body: {follow_user_id: string}
 */
usersRouter.post('/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapRequest(followController)
);

/**
 * Description. Unfollow someone
 * Path: /follow/:user_id
 * Method: DELETE
 * Header: { Authorization: Bearer <access_token>}
 * Body: {}
 */
usersRouter.delete('/follow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapRequest(unfollowController)
);

/**
 * Description. Change password
 * Path: /change-password
 * Method: PUT
 * Header: { Authorization: Bearer <access_token>}
 * Body: {old_password: string,password: string,confirm_password: string}
 */
usersRouter.delete('/follow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapRequest(unfollowController)
);

export default usersRouter;