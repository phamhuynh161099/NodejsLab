import express from "express"
import usersRouter from "./routes/users.routes"
import pool from "./services/database-mysql.service"
import { defaultErrorHandler } from "./middlewares/error.middleware"

const app = express()
const port = 3000

app.use(express.json());

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