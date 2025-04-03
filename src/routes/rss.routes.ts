import express from "express";
import { postAlert, getAllAlerts } from "../controller/rss.controller";

const router = express.Router();

router.get("/getrss", getAllAlerts);
router.post("/", postAlert);

export default router;
