import { Router } from "express";
import avatar from "./users/avatar";
import avatars from "./profile/avatars";

const router = Router();

router.use(avatar);
router.use(avatars);

export default router;
