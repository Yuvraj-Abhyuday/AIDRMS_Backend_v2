// authRoutes.ts
import express from "express";
import { login, signup } from "../controller/auth.controller";

const router = express.Router();

// POST endpoint for user signup
router.post("/login", login);
router.post("/signup", signup);

export default router;
