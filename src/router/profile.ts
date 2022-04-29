import express from "express";
import history from "./menu/history";
import profile from "./profile/profile";
import getavatars from "./profile/getavatars";

const router = express.Router();
router.use(history);
router.use(profile);
router.use(getavatars);
export default router;
