import express from "express";
import { postAlert, getAllAlerts } from "../controller/rss.controller";

const router = express.Router();

router.post("/", postAlert);
router.get("/", getAllAlerts);

export default router;
