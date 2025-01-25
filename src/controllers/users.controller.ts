import { Request, Response, NextFunction } from "express";
import { ParamsDictionary } from 'express-serve-static-core'
import UserService from "~/services/users.service";
import jwt, { JwtPayload } from 'jsonwebtoken'
import HTTP_STATUS from "~/constants/httpStatus";
import { USERS_MESSAGES } from "~/constants/messages";
import { UserVerifyStatus } from "~/constants/enum";
import { pick } from "lodash";
import { ErrorWithStatus } from "~/models/Error";

export const loginController = async (req: Request<ParamsDictionary, any, any>, res: Response, next: NextFunction) => {
  const result = await UserService.login(req.body)
  res.status(200).json({
    message: 'Login Success',
    result
  });

  return;
}


export const registerController = async (req: Request<ParamsDictionary, any, any>, res: Response, next: NextFunction) => {
  const result = await UserService.register(req.body);
  res.status(200).json({
    message: 'Register Success',
    result
  });

  return;
}


export const logoutController = async (req: Request<ParamsDictionary, any, any>, res: Response, next: NextFunction) => {
  const result = await UserService.logout(req.body);
  res.status(200).json({
    message: 'Logout Success',
    result
  });

  return;
}


export const refreshTokenController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id, verify , exp} = req.decode_refresh_token; 
  const { refresh_token } = req.body;
  const result = await UserService.refreshToken({ user_id, verify, refresh_token, exp})

  res.status(200).json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  });
  return;
}

export const emailVerifyController = async (req: Request<ParamsDictionary, any, any>, res: Response, next: NextFunction) => {
  const { decode_email_verify_token } = req.body;

  const { user_id } = (decode_email_verify_token) as jwt.JwtPayload;
  const user = await UserService.checkUserExist({ user_id });

  // Không tìm thấy user
  if (!user) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    });
    return;
  }

  // Đã verify rồi
  if (user.email_verify_token === '') {
    res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE
    });
    return;
  }

  const result = await UserService.verifyEmail({ user_id })

  res.status(200).json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  });

  return;
}

export const resendEmailVerifyController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization;
  const user = await UserService.checkUserExist({ user_id });

  if (!user) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
    return;
  }

  if (user.verify === UserVerifyStatus.Verified) {
    res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE,
    })
    return;
  }

  const result = await UserService.resendVerifyEmail({ user_id });
  res.json(result);

  return;
}

export const forgotPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  const { id, verify } = req.user;
  const result = await UserService.forgotPassword({ id, verify })


  res.json(result);
  return;
}

export const verifyForgotPasswordTokenController = async (req: Request, res: Response, next: NextFunction) => {
  res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_SUCCESS
  });
  return;
}

export const resetPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_forgot_password_token;
  const { password } = req.body;
  const result = await UserService.resetPassword({ user_id, password })

  res.json({
    result
  });
  return;
}

export const getMeController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization;
  const user = await UserService.getMe({ user_id })

  res.json({
    message: USERS_MESSAGES.GET_ME_SUCCESS,
    result: user
  });
  return;
}

export const updateMeController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization;
  const updateFields = req.body;
  // Lọc những trường cần thiêt bằng lodash pick
  // const updateFields = pick(req.body,['username']);

  const result = await UserService.updateMe({ user_id, updateFields })

  res.json({
    message: "Upate Success",
    result
  });
  return;
}

export const getProfileController = async (req: Request, res: Response, next: NextFunction) => {
  const { username } = req.params;
  const user = await UserService.getProfile({ username });

  if (!user) {
    throw new ErrorWithStatus({
      message: USERS_MESSAGES.USER_NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND
    });

    return;
  }

  res.json({
    message: USERS_MESSAGES.GET_PROFILE_SUCCESS,
    result: user
  });
  return;
}

export const followController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization;
  const { follow_user_id } = req.body;

  const result = await UserService.follow({ user_id, follow_user_id });

  res.json(result);
  return;
}

export const unfollowController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization;
  const { user_id: followed_user_id } = req.params;

  const result = await UserService.unfollow({ user_id, followed_user_id });

  res.json(result);
  return;
}

export const chnagePasswordController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decode_authorization;
  const { password } = req.params;

  const result = await UserService.changePassword({ user_id, password });

  res.json(result);
  return;
}