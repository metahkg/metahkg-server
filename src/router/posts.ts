import express from "express";
import threads from "./posts/thread";
import addComment from "./posts/comment";
import create from "./posts/create";
import checkExist from "./posts/checkexist";
import userVotes from "./posts/userVotes";
import images from "./posts/images";
import pin from "./posts/pin";
import unpin from "./posts/unpin";

const router = express.Router();

router.use(threads);
router.use(addComment);
router.use(create);
router.use(checkExist);
router.use(images);
router.use(pin);
router.use(unpin);
router.use(userVotes);

export default router;
