import express from "express";
import history from "./profile/history";
import profile from "./profile/profile";
import avatar from "./profile/avatar";
const router = express.Router();
router.use(history);
router.use(profile);
router.use(avatar);
export default router;
