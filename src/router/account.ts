import express from "express";
import register from "./account/register";
import signin from "./account/signin";
import verify from "./account/verify";
import resend from "./account/resend";
import editprofile from "./account/editprofile";
import avatar from "./account/avatar";
import logout from "./account/logout";

const router = express.Router();
router.use(register);
router.use(signin);
router.use(verify);
router.use(resend);
router.use(editprofile);
router.use(avatar);
router.use(logout);
export default router;
