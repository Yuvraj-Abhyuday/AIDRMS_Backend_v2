import express from "express";
import userRoutes from "./auth.routes";
import alertRoutes from "./alert.routes";

const router = express.Router();

// Register user routes under /api/users
router.use("/alerts", alertRoutes);

export default router;
