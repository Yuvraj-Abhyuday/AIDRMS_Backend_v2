import express from "express";
import alertRoutes from "./alert.routes";

const router = express.Router();

// Register user routes under /api/users
router.use("/alerts", alertRoutes);

router.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default router;
