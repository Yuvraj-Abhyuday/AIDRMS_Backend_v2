import express from "express";
import {
  loginProcess,
  signUpProcess,
  forgetPassword,
} from "../controller/auth.controller";

const router = express.Router();

router.post("/login", loginProcess);
router.post("/signup", signUpProcess);
router.post("/forgot-password", forgetPassword); // Fixed route

export default router;
