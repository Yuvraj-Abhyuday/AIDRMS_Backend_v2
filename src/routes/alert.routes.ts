import express from "express";
import {
  fetchDataAndStore,
  getData,
} from "../controller/alertFetch.controller";

const router = express.Router();

// Trigger scraping manually
router.get("/fetch", fetchDataAndStore);

// Retrieve stored alerts
router.get("/data", getData);

export default router;