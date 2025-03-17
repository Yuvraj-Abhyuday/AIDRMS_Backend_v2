import { Router } from "express";
import { postSOS } from "../controller/sos.controller";

const router = Router();

router.post("/sos", postSOS);

export default router;
