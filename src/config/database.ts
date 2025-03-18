import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

export const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: Number(process.env.DB_PORT) || 5432, // Ensure it's a number
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : false, // Secure SSL setup
});
