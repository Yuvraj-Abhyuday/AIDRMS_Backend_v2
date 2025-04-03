import express from "express";
import { handleScraperRequest } from "../controller/rssalert.controller";

const router = express.Router();

router.post("/", handleScraperRequest);

export default router;