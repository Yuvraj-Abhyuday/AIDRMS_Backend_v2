import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: Number(process.env.DB_PORT) || 5432,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false, // Allows self-signed certs (RDS uses these)
  },
});

export const testDbConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    const res = await client.query("SELECT NOW()");
    console.log("Database connected successfully: ", res.rows[0]);
    client.release();
  } catch (error) {
    console.error("Database connection failed: ", error);
    process.exit(1);
  }
};

export const setupNotificationListener = async (): Promise<void> => {
  try {
    const client = await pool.connect();

    await client.query("LISTEN new_data");

    client.on("notification", (msg) => {
      try {
        if(msg.payload) {
          console.log("Database Update Detected: ", JSON.parse(msg.payload));
        } else {
          console.warn("Notification received but no payload.");
        }
      } catch (error) {
        console.error("Error processing database notification:", error);
      }
    });

    client.on("error", (err) => {
      console.error("PostgreSQL Listener Error: ", err);
    });

    console.log("Listening for real-time database changes...");
  } catch (error) {
    console.log("Failed to set up database listener: ", error);
  }
};

testDbConnection();
setupNotificationListener();