// routes/index.ts
import express, { Router } from "express";
import authRoutes from "./auth.routes";
import alertRoutes from "./alert.routes";
import { postSOS } from "../controller/sos.controller";
import rssRoutes from "./rss.routes";
import rssalert from "./rssalert.routes";

const router: Router = express.Router();

// Route registrations
router.use("/auth", authRoutes);
router.post("/sos", postSOS);
router.use("/rss", rssRoutes);
router.use("/alerts", alertRoutes);
router.use("/rssalert", rssalert)

// 404 handler
router.all("*", (req: express.Request, res: express.Response) => {
  res.status(404).json({ message: "Route not found" });
});

export default router;
