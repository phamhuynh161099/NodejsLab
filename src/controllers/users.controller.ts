import { Request, Response, NextFunction } from "express";
import { ParamsDictionary } from 'express-serve-static-core'
import UserService from "~/services/users.service";
import jwt from 'jsonwebtoken'
import HTTP_STATUS from "~/constants/httpStatus";
import { USERS_MESSAGES } from "~/constants/messages";

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

export const emailVerifyValidator = async (req: Request<ParamsDictionary, any, any>, res: Response, next: NextFunction) => {  
  const { decode_email_verify_token } = req.body;

  console.log('decode_email_verify_token',decode_email_verify_token)

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

  const result = await UserService.verifyEmail({user_id})

  res.status(200).json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  });

  return;
}