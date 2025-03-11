// authRoutes.ts
import express from "express";
import { signUpProcess } from "../controller/auth.controller";

const router = express.Router();

// POST endpoint for user signup
router.post("/signup", signUpProcess);

export default router;
