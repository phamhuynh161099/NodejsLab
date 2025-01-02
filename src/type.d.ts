import { Request } from 'express';
import { Jwt } from 'jsonwebtoken';

/**
 * declare module 'express' : Khai báo rằng bạn đang mở rộng module 'express'.
 * interface Request: Mở rộng interface Request gốc của Express.
 */
declare module 'express' {
  interface Request {
    decode_authorization?: Jwt.JwtPayload,
    user?: any,
    decode_forgot_password_token?:Jwt.JwtPayload,
  }
}