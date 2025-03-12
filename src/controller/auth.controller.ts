// authController.ts
import { Request, Response } from "express";
import { createUser, checkUserExists } from "../models/user.model";
import { pool } from '../config/database';

// For Signup
export const signup = async (req: Request, res: Response): Promise<void> => {
  const { name, number, email, designation, password } = req.body;

  if (!name || !email || !number || !designation || !password) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  try {
    await pool.query('BEGIN');

    // Check if user already exists
    const userExists = await checkUserExists(email);
    if (userExists.rows.length > 0) {
      await pool.query('ROLLBACK');
      res.status(400).json({
        message: "Email already exists"
      });
      return;
    }

    // Insert the user into the database
    await createUser(name, number, email, designation, password);
    await pool.query('COMMIT');

    res.status(201).json({
      message: "User registered successfully"
    });
    return;

  } catch (err: any) {
    await pool.query('ROLLBACK');
    console.error("Database error:", err.message);

    res.status(500).json({
      message: "Something went wrong",
      error: err.message
    });
    return;
  }
};

// For Login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { number, password } = req.body;

  if (!number || !password) {
    res.status(400).json({
      message: "Number and Password are required"
    });
    return;
  }

  try {
    await pool.query('SELECT 1');
  } catch (error) {
    console.error("Database is disconnected", error);
    res.status(500).json({
      message: "Database connection lost"
    });
    return;
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE number = $1', [number]);

    if (result.rows.length === 0) {
      res.status(404).json({
        message: "User not found"
      });
      return;
    }

    const user = result.rows[0];
    if (user.password !== password) {
      res.status(401).json({
        message: "Invalid Credentials"
      });
      return;
    }

    console.log("Login Successful");
    res.status(200).json({
      message: "Login Successful"
    });
  } catch (err: any) {
    console.error("Database error", (err as Error).message);
    res.status(500).json({
      message: "Something went wrong"
    });
  }
};