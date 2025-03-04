import express from "express";
import {
  fetchDataAndStore,
  getData,
} from "../controller/alertFetch.controller";

const router = express.Router();

router.get("/fetch", fetchDataAndStore);
router.get("/data", getData);

export default router;
