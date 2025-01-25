import { FieldPacket, OkPacket, ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "./database-mysql.service";
import { RegisterReqBody } from "~/models/requests/user.request";
import { hashPassword } from "~/utils/crypto";
import { signToken } from "~/utils/jwt";
import { TokenType, UserVerifyStatus } from "~/constants/enum";
import { USERS_MESSAGES } from "~/constants/messages";
import { verify } from "crypto";




const signAccessToken = ({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) => {
  return signToken({
    payload: {
      user_id,
      token_type: TokenType.AccessToken,
      verify
    },
    privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
    options: {
      expiresIn: process.env.ACCESS_TOKEN_EXP_IN
    }
  })
}

const signRefreshToken = ({ user_id, verify, exp }: { user_id: string, verify: UserVerifyStatus, exp?: number }) => {
  if (exp) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify,
        exp
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        // expiresIn: process.env.REFRESH_TOKEN_EXP_IN
      }
    })
  }

  return signToken({
    payload: {
      user_id,
      token_type: TokenType.RefreshToken,
      verify
    },
    privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
    options: {
      expiresIn: process.env.REFRESH_TOKEN_EXP_IN
    }
  })
}

const signEmailVerifyToken = ({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) => {
  return signToken({
    payload: {
      user_id,
      token_type: TokenType.EmailVerifyToken,
      verify
    },
    privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
    options: {
      expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXP_IN
    }
  })
}

const signForgotPasswordToken = ({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) => {
  return signToken({
    payload: {
      user_id,
      token_type: TokenType.ForgotPasswordToken,
      verify
    },
    privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
    options: {
      expiresIn: process.env.EMAIL_FORGOT_PASSWORD_TOKEN_EXP_IN
    }
  })
}

const signAccessAndRefreshToken = ({ user_id, verify }: { user_id: string, verify: UserVerifyStatus }) => {
  return Promise.all([
    signAccessToken({ user_id, verify }),
    signRefreshToken({ user_id, verify })
  ])
}

const register = async (payload: RegisterReqBody) => {
  const { nanoid } = await import('nanoid'); // use dynamic import()
  const randomId = nanoid(20);
  const email_verify_token = await signEmailVerifyToken({ user_id: randomId, verify: UserVerifyStatus.Unverified });

  const { username, password, email } = payload;
  let handledPassword = hashPassword(password);

  const sql = `INSERT INTO users (id,username,password,email,email_verify_token) VALUES (?,?, ?, ?,?)`;
  const [result]: [ResultSetHeader, FieldPacket[]] = await pool.query(sql, [randomId, username, handledPassword, email, email_verify_token])

  if (result) {
    const [access_token, refresh_token] = await signAccessAndRefreshToken({ user_id: randomId, verify: UserVerifyStatus.Unverified });


    const sql_refresh_tokens = `INSERT INTO refresh_tokens (token, user_id, iat, exp) VALUES (?, ?, ?, ?)`;
    const [result_refresh_tokens]: [ResultSetHeader, FieldPacket[]] =
      await pool.query(sql_refresh_tokens, [
        refresh_token,
        randomId,
        process.env.ACCESS_TOKEN_EXP_IN,
        process.env.REFRESH_TOKEN_EXP_IN]);

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

export const resendVerifyEmail = async (payload: { user_id: string }) => {
  const { user_id } = payload;
  const email_verify_token = await signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified });

  console.log('email_verify_token', email_verify_token)

  const sql = `UPDATE users SET email_verify_token = ?,updated_at = CURRENT_TIMESTAMP() WHERE id = ?`;
  const [result] = await pool.query<OkPacket>(sql, [email_verify_token, user_id]);

  return {
    message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
  };
};


export const login = async (payload: { email: string, password: string }) => {
  const { email, password } = payload;
  let hashedPassword = hashPassword(password);

  const sql = `SELECT * FROM users WHERE email = ? and password = ? LIMIT 1`;
  const [rows] = await pool.query<RowDataPacket[]>(sql, [email, hashedPassword]);

  if (!!rows && 'id' in rows[0]) {
    const [access_token, refresh_token] = await signAccessAndRefreshToken({ user_id: rows[0].id, verify: rows[0].verify });

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

  const [access_token, refresh_token] = await signAccessAndRefreshToken({ user_id, verify: UserVerifyStatus.Verified });
  const sql_refresh_tokens = `INSERT INTO refresh_tokens (token, user_id, iat, exp) VALUES (?, ?, ?, ?)`;
  const [result_refresh_tokens]: [ResultSetHeader, FieldPacket[]] =
    await pool.query(sql_refresh_tokens, [
      refresh_token,
      user_id,
      process.env.ACCESS_TOKEN_EXP_IN,
      process.env.REFRESH_TOKEN_EXP_IN]);


  return {
    access_token, refresh_token
  }
};

export const findUserByEmail = async (payload: { email: string }): Promise<any> => {
  const { email } = payload;
  const sql = `SELECT * FROM users WHERE email = ? LIMIT 1`;
  const [rows] = await pool.query<RowDataPacket[]>(sql, [email])

  return (rows.length > 0) ? rows[0] : null;
};

export const forgotPassword = async (payload: { id: string, verify: UserVerifyStatus }): Promise<any> => {
  const { id, verify } = payload;
  const forgot_password_token = await signForgotPasswordToken({ user_id: id, verify: verify });

  const sql = `UPDATE users SET forgot_password_token = ?,updated_at = CURRENT_TIMESTAMP() WHERE id = ?`;
  const [result] = await pool.query<OkPacket>(sql, [forgot_password_token, id]);

  // fake proccess send mail
  console.log('forgot_password_token', forgot_password_token);

  return {
    message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
  }

};

export const resetPassword = async (payload: { user_id: string, password: string }): Promise<any> => {
  const { user_id, password } = payload;
  let handledPassword = hashPassword(password);

  const sql = `UPDATE users SET forgot_password_token = '', password = ?, updated_at = CURRENT_TIMESTAMP() WHERE id = ?`;
  const [result] = await pool.query<OkPacket>(sql, [handledPassword, user_id]);



  return {
    message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
  }

};


export const getMe = async (payload: { user_id: string }): Promise<any> => {
  const { user_id } = payload;

  const sql = `SELECT T1.username,T1.email FROM users T1 WHERE id = ? LIMIT 1`;
  const [rows] = await pool.query<RowDataPacket[]>(sql, [user_id])

  return (rows.length > 0) ? rows[0] : null;

};

export const updateMe = async (payload: { user_id: string, updateFields: any }): Promise<any> => {
  const { user_id, updateFields } = payload;

  // Không có trường cần update
  if (Object.keys(updateFields).length === 0) {

  } else {
    let setClause = Object.keys(updateFields)
      .map((field) => `${field} = ?`)
      .join(', ');
    setClause = setClause + ", updated_at = CURRENT_TIMESTAMP() "

    const values = Object.values(updateFields);
    // Thêm id vào cuối mảng giá trị
    values.push(user_id);

    const sql = `UPDATE users SET ${setClause} WHERE id = ?`;
    const [result] = await pool.query<OkPacket>(sql, values);
  }


  // Truy vấn SELECT để lấy dữ liệu mới cập nhật
  const selectSql = `SELECT * FROM users WHERE id = ? LIMIT 1`;
  const [rows] = await pool.query<RowDataPacket[]>(selectSql, [user_id]);

  return (rows && rows[0]) ? rows[0] : null
};


export const getProfile = async (payload: { username: string }): Promise<any> => {
  const { username } = payload;

  const sql = `SELECT T1.username,T1.email FROM users T1 WHERE username = ? LIMIT 1`;
  const [rows] = await pool.query<RowDataPacket[]>(sql, [username])

  return (rows.length > 0) ? rows[0] : null;

};

export const follow = async (payload: { user_id: string, follow_user_id: string }): Promise<any> => {
  const { user_id, follow_user_id } = payload;

  const sql_check_exist = `SELECT T1.id FROM followers T1 WHERE T1.user_id = ? AND T1.followed_user_id = ? LIMIT 1`;
  const [rows] = await pool.query<RowDataPacket[]>(sql_check_exist, [
    user_id,
    follow_user_id
  ]);

  if (rows.length === 0) {
    const sql = `INSERT INTO followers (user_id, followed_user_id) VALUES (?, ?)`;
    const [result]: [ResultSetHeader, FieldPacket[]] =
      await pool.query(sql, [
        user_id,
        follow_user_id
      ]);

    return {
      message: USERS_MESSAGES.FOLLOW_SUCCESS
    }
  }

  return {
    message: USERS_MESSAGES.FOLLOWED
  }
};

export const unfollow = async (payload: { user_id: string, followed_user_id: string }): Promise<any> => {
  const { user_id, followed_user_id } = payload;

  const sql_check_exist = `SELECT T1.id FROM followers T1 WHERE T1.user_id = ? AND T1.followed_user_id = ? LIMIT 1`;
  const [rows] = await pool.query<RowDataPacket[]>(sql_check_exist, [
    user_id,
    followed_user_id
  ]);

  if (rows.length === 0) {
    return {
      message: USERS_MESSAGES.ALREADY_UNFOLLOWED
    }
  }


  const sql = `DELETE FROM followers WHERE id = ?`;
  const [result] = await pool.query<OkPacket>(sql, [rows[0].id]);

  return {
    message: USERS_MESSAGES.UNFOLLOW_SUCCESS
  }
};


export const changePassword = async (payload: { user_id: string, password: string }): Promise<any> => {
  const { user_id, password } = payload;
  let handledPassword = hashPassword(password);

  const sql = `UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP() WHERE id = ?`;
  const [result] = await pool.query<OkPacket>(sql, [handledPassword, user_id]);

  return {
    message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS
  }

};

export const refreshToken = async (payload: { user_id: string, verify: UserVerifyStatus, refresh_token: string, exp: number }) => {
  const { user_id, verify, refresh_token, exp } = payload;

  const sql = `DELETE FROM refresh_tokens WHERE token = ?`;
  const [new_access_token, new_refresh_token] = await Promise.all([
    signAccessToken({ user_id, verify }),
    signRefreshToken({ user_id, verify, exp }),
    pool.query<OkPacket>(sql, [refresh_token])
  ]);


  // Insert refresh token vao DB
  const sql_refresh_tokens = `INSERT INTO refresh_tokens (token, user_id, iat, exp) VALUES (?, ?, ?, ?)`;
  const [result_refresh_tokens]: [ResultSetHeader, FieldPacket[]] =
    await pool.query(sql_refresh_tokens, [
      refresh_token,
      user_id,
      process.env.ACCESS_TOKEN_EXP_IN,
      process.env.REFRESH_TOKEN_EXP_IN]);

  return {
    access_token: new_access_token,
    refresh_token: new_refresh_token
  }
}

const UserService = {
  register,
  checkEmailExist,
  login,
  checkRefreshTokenExist,
  logout,
  checkUserExist,
  signEmailVerifyToken,
  verifyEmail,
  resendVerifyEmail,
  findUserByEmail,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
  getProfile,
  follow,
  unfollow,
  changePassword,
  refreshToken
};
export default UserService