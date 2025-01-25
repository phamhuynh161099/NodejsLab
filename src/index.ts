import express from "express"
import usersRouter from "./routes/users.routes"
import pool from "./services/database-mysql.service"
import { defaultErrorHandler } from "./middlewares/error.middleware"
import mediasRouter from "./routes/medias.routes"
import { initFolder } from "./utils/file"
import dotenv from 'dotenv'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_TEMP_DIR } from "./constants/dir"
import staticRoute from "./routes/static.routes"

//========================================

const app = express()

dotenv.config();
const port = process.env.PORT || 3000;
console.log(process.env.PORT)


// Tạo folder upload
initFolder()

// Nếu thiếu thì khi đọc request sẽ không đọc được giá trị bên trong
app.use(express.json());

// Test kết nối đến mysqlDB
app.get('/test-db', async (req, res) => {
  try {
    const [rows, fields] = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
})
app.use('/users', usersRouter);
app.use('/medias', mediasRouter);


// express.static(UPLOAD_IMAGE_DIR) Trỏ thẳng tới thư mục lưu ảnh
// app.use('/static',express.static(UPLOAD_IMAGE_DIR))
app.use('/static',staticRoute);
app.use('/static/video',express.static(UPLOAD_VIDEO_TEMP_DIR));

app.use(defaultErrorHandler)


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});