import { Request, Response } from "express";
import { createUser, checkUserExists } from "../models/user.model";
import { pool } from "../config/database";

export const signup = async (req: Request, res: Response): Promise<void> => {
  const { name, number, email, designation, department, position, password } = req.body;

  if (!name || !email || !number || !designation || !department || !position || !password) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  try {
    await pool.query("BEGIN");

    const userExists = await checkUserExists(number);
    if (userExists.rows.length > 0) {
      await pool.query("ROLLBACK");
      res.status(400).json({ message: "Number already exists" });
      return;
    }

    const { user_id, designation: storedDesignation } = await createUser(
      name,
      number,
      email,
      designation,
      department,
      position,
      password
    );
    await pool.query("COMMIT");

    res.status(201).json({
      message: "User registered successfully",
      user_id: user_id, // Use the returned user_id
      designation: storedDesignation, // Use the designation from the database
    });
    return;
  } catch (err: any) {
    await pool.query("ROLLBACK");
    console.error("Database error:", err.message);
    res.status(500).json({
      message: "Something went wrong",
      error: err.message,
    });
    return;
  }
};

// login function remains unchanged
export const login = async (req: Request, res: Response): Promise<void> => {
  const { number, password } = req.body;

  if (!number || !password) {
    res.status(400).json({ message: "Number and Password are required" });
    return;
  }

  try {
    await pool.query("SELECT 1");
  } catch (error) {
    console.error("Database is disconnected", error);
    res.status(500).json({ message: "Database connection lost" });
    return;
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE number = $1", [number]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const user = result.rows[0];
    if (user.password !== password) {
      res.status(401).json({ message: "Invalid Credentials" });
      return;
    }

    console.log("Login Successful");
    res.status(200).json({ message: "Login Successful", user: user });
  } catch (err: any) {
    console.error("Database error", (err as Error).message);
    res.status(500).json({ message: "Something went wrong" });
  }
};