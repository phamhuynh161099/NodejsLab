import { Request, Response } from "express";
import { FieldPacket, ResultSetHeader } from "mysql2";
import pool from "~/services/database-mysql.service";
import RegisterService from "~/services/users.service";

export const loginController = (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (email == "1") {
      res.status(200).json({
        message: "Login Success!"
      })
    } else {
      res.status(400).json({
        message: "Login Error!"
      })
    }

    return;
  } catch (error) {
    res.status(500).json({
      message: error
    })

    return;
  }
}


export const registerController = (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const result = RegisterService.register({ username, password });

    res.status(200).json({
      message: result
    });

    return;

  } catch (error) {
    res.status(500).json({
      message: error
    });
    return;
  }
}