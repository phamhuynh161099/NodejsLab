import { NextFunction, Request, Response } from "express";
import { pick } from "lodash";

// type lấy các giá trị key của obj thành mảng
/**
 * interface A {
 *  username: string
 *  bio: string
 * } => ['username','bio']
 */
type FilterKeys<T> = Array<keyof T>;

export const filterMiddleware = (filterKeys: string[]) => (req: Request, res: Response, next: NextFunction) => {
  req.body = pick(req.body,filterKeys)
  next();
}