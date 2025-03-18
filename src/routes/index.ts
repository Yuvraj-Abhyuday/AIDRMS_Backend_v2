import express from "express";
import alertRoutes from "./alert.routes";

const router = express.Router();

// Register alert routes under /api/alerts
router.use("/alerts", alertRoutes);

// Catch-all for undefined routes (optional)
router.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default router;