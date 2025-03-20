// routes/index.ts
import express, { Router } from "express";
import authRoutes from "./auth.routes";
import postSOS from "./sos.routes";
import alertRoutes from "./alert.routes";

const router: Router = express.Router();

// Route registrations
router.use("/auth", authRoutes);
router.use("/sos", postSOS);
router.use("/alerts", alertRoutes);

// 404 handler
router.all("*", (req: express.Request, res: express.Response) => {
  res.status(404).json({ message: "Route not found" });
});

export default router;