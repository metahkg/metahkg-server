import express from "express";
import register from "./users/register";
import signin from "./users/signin";
import verify from "./users/verify";
import resend from "./users/resend";
import editprofile from "./users/editprofile";
import avatar from "./users/avatar";

const router = express.Router();
router.use(register);
router.use(signin);
router.use(verify);
router.use(resend);
router.use(editprofile);
router.use(avatar);
export default router;
