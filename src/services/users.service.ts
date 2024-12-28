import { FieldPacket, ResultSetHeader } from "mysql2";
import pool from "./database-mysql.service";

const register = async (payload:any) => {
  const { username, password } =payload;

    const sql = `INSERT INTO users (username, password,email) VALUES (?, ?, "${username}@hsvina.com")`;
    const [result]: [ResultSetHeader, FieldPacket[]] = await pool.query(sql, [username, password])
    console.log('Insert Id', result.insertId,)
   
    return result
}

const RegisterService = {register};
export default RegisterService