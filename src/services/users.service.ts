import { FieldPacket, OkPacket, ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "./database-mysql.service";
import { RegisterReqBody } from "~/models/requests/user.request";
import { hashPassword } from "~/utils/crypto";
import { signToken } from "~/utils/jwt";
import { TokenType, UserVerifyStatus } from "~/constants/enum";




const signAccessToken = (user_id: string) => {
  return signToken({
    payload: {
      user_id,
      token_type: TokenType.AccessToken
    },
    privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
    options: {
      expiresIn: process.env.ACCESS_TOKEN_EXP_IN
    }
  })
}

const signRefreshToken = (user_id: string) => {
  return signToken({
    payload: {
      user_id,
      token_type: TokenType.RefreshToken
    },
    privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
    options: {
      expiresIn: process.env.REFRESH_TOKEN_EXP_IN
    }
  })
}

const signEmailVerifyToken = (user_id: string) => {
  return signToken({
    payload: {
      user_id,
      token_type: TokenType.EmailVerifyToken
    },
    privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
    options: {
      expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXP_IN
    }
  })
}

const signAccessAndRefreshToken = (user_id: string) => {
  return Promise.all([
    signAccessToken(user_id),
    signRefreshToken(user_id)
  ])
}

const register = async (payload: RegisterReqBody) => {
  const { nanoid } = await import('nanoid'); // use dynamic import()
  const randomId = nanoid(10);
  const email_verify_token = await signEmailVerifyToken(randomId);

  const { username, password, email } = payload;
  let handledPassword = hashPassword(password);

  const sql = `INSERT INTO users (id,username,password,email,email_verify_token) VALUES (?,?, ?, ?,?)`;
  const [result]: [ResultSetHeader, FieldPacket[]] = await pool.query(sql, [randomId, username, handledPassword, email, email_verify_token])

  if (result) {
    const [access_token, refresh_token] = await signAccessAndRefreshToken(randomId);


    const sql_refresh_tokens = `INSERT INTO refresh_tokens (token, user_id, iat, exp) VALUES (?, ?, ?, ?)`;
    const [result_refresh_tokens]: [ResultSetHeader, FieldPacket[]] =
      await pool.query(sql_refresh_tokens, [
        refresh_token,
        randomId,
        process.env.ACCESS_TOKEN_EXP_IN,
        process.env.REFRESH_TOKEN_EXP_IN]);

    console.log('email_verify_token', email_verify_token)

    return {
      access_token, refresh_token
    }
  } else {
    throw new Error('Failed to insert user');
  }
}


export const checkEmailExist = async (payload: { email: string }): Promise<boolean> => {
  const { email } = payload;
  const sql = `SELECT 1 FROM users WHERE email = ? LIMIT 1`;
  const [rows] = await pool.query<RowDataPacket[]>(sql, [email])

  return rows.length > 0;
};

export const checkUserExist = async (payload: { user_id: string }): Promise<any> => {
  const { user_id } = payload;
  const sql = `SELECT * FROM users WHERE id = ? LIMIT 1`;
  const [rows] = await pool.query<RowDataPacket[]>(sql, [user_id])

  return (rows.length > 0) ? rows[0] : null;
};

export const checkRefreshTokenExist = async (payload: { token: string }): Promise<boolean> => {
  const { token } = payload;
  const sql = `SELECT 1 FROM refresh_tokens WHERE token = ? LIMIT 1`;
  const [rows] = await pool.query<RowDataPacket[]>(sql, [token])

  return rows.length > 0;
};


export const login = async (payload: { email: string, password: string }) => {
  const { email, password } = payload;
  let hashedPassword = hashPassword(password)
  const sql = `SELECT * FROM users WHERE email = ? and password = ? LIMIT 1`;
  const [rows] = await pool.query<RowDataPacket[]>(sql, [email, hashedPassword]);

  console.log("result", rows);
  if (!!rows && 'id' in rows[0]) {
    const [access_token, refresh_token] = await signAccessAndRefreshToken(rows[0].id);

    const sql_refresh_tokens = `INSERT INTO refresh_tokens (token, user_id, iat, exp) VALUES (?, ?, ?, ?)`;
    const [result_refresh_tokens]: [ResultSetHeader, FieldPacket[]] =
      await pool.query(sql_refresh_tokens, [
        refresh_token,
        rows[0].id,
        process.env.ACCESS_TOKEN_EXP_IN,
        process.env.REFRESH_TOKEN_EXP_IN]);


    return {
      access_token, refresh_token
    }
  } else {
    throw new Error('Failed to login');
  }
};


export const logout = async (payload: { refresh_token: string }): Promise<boolean> => {
  const { refresh_token } = payload;
  const sql = `DELETE FROM refresh_tokens WHERE token = ?`;
  const [result] = await pool.query<OkPacket>(sql, [refresh_token]);

  return result.affectedRows > 0; // Trả về true nếu xóa thành công (có ít nhất 1 hàng bị ảnh hưởng), false nếu không
};


export const verifyEmail = async (payload: { user_id: string }) => {
  const { user_id } = payload;

  const sql = `UPDATE users SET email_verify_token = '',verify = ? WHERE id = ?`;
  const [result] = await pool.query<OkPacket>(sql, [UserVerifyStatus.Verified, user_id]);

  const [access_token, refresh_token] = await signAccessAndRefreshToken(user_id);
  return {
    access_token, refresh_token
  }
};


const UserService = { register, checkEmailExist, login, checkRefreshTokenExist, logout, checkUserExist, signEmailVerifyToken, verifyEmail };
export default UserService