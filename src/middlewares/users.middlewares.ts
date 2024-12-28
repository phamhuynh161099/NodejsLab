import { NextFunction, Request, Response } from "express";

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  console.log('req.body', req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      error: 'Missing email or password'
    });
  } else {
    next();
  }
}

// export const registerValidator = 