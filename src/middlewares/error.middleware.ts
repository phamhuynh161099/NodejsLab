import { NextFunction, Request, Response } from "express";
import { omit } from "lodash";
import HTTP_STATUS from "~/constants/httpStatus";
import { ErrorWithStatus } from "~/models/Error";


export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrorWithStatus) {
    res.status(err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json(err)
    return;
  }

  Object.getOwnPropertyNames(err).forEach((key) => {
    Object.defineProperty(err, key, { enumerable: true })
  })
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    message: err.message,
    errorInfor: omit(err, ['stack'])
  });
  return;
}