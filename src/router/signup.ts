import express from "express";
import register from "./signup/register";
import verify from "./signup/verify";
const router = express.Router();
router.use(register);
router.use(verify);
export default router;
