import { Request, Response } from "express";

// Login process
export const loginProcess = (req: Request, res: Response) => {
  res.json({ message: "User logged in successfully!" });
};

// Signup process
export const signUpProcess = (req: Request, res: Response) => {
  res.json({ message: "User registered successfully!" });
};

// Forgot password process
export const forgetPassword = (req: Request, res: Response) => {
  res.json({ message: "Password reset link sent to email!" });
};
