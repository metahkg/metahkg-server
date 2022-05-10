import express from "express";
import register from "./users/register";
import signIn from "./users/signin";
import status from "./users/status";
import verify from "./users/verify";
import resend from "./users/resend";
import editProfile from "./users/editprofile";
import avatar from "./users/avatar";
import block from "./users/block";
import unblock from "./users/unblock";

const router = express.Router();

router.use(register);
router.use(signIn);
router.use(verify);
router.use(resend);
router.use(editProfile);
router.use(avatar);
router.use(block);
router.use(unblock);
router.use(status);

export default router;
