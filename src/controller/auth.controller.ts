// authController.ts
import { Request, Response } from "express";
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

export const signUpProcess = async (req: Request, res: Response) => {
  try {
    const { name, number, email, designation, password } = req.body;

    const result = await pool.query(
      "INSERT INTO users (name, number, email,designation, password) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [name, number, email, designation, password]
    );
    res.status(201).json({
      message: "User registered successfully!",
      userId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
