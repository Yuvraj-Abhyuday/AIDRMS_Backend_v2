import express from "express";
import { getAlerts } from "../controller/alert.controller";

const router = express.Router();

router.get("/", getAlerts);

export default router;
