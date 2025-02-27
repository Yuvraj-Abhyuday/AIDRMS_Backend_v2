import express from "express";
import { fetchAlerts } from "../controller/alert.controller";

const router = express.Router();

router.get("/", fetchAlerts);

export default router;
