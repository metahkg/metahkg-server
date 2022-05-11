import { Router } from "express";
import thread from "./thread/thread";
import comment from "./thread/comment";
import replies from "./thread/replies";

const router = Router();

router.use(thread);
router.use(comment);
router.use(replies);

export default router;
