
import mysql from "mysql2/promise"
import dotenv from 'dotenv'

dotenv.config();
const pool = mysql.createPool({
  host: process.env.DB_HOST,       // Địa chỉ MySQL server
  user: 'dbeaver_user',  // Tên đăng nhập MySQL
  password: 'password123',// Mật khẩu MySQL
  database: 'nodejs_lab',// Tên database
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Hàm test connection
export async function testConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection successful!');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1); // Thoát ứng dụng nếu kết nối CSDL thất bại
  }
}

export default pool;