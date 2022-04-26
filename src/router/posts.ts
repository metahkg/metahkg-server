import express from "express";
import threads from "./posts/thread";
import addComment from "./posts/addComment";
import create from "./posts/create";
import checkexist from "./posts/checkexist";
import images from "./posts/images";
import pin from "./posts/pin";
import unpin from "./posts/unpin";

const router = express.Router();
router.use(threads);
router.use(addComment);
router.use(create);
router.use(checkexist);
router.use(images);
router.use(pin);
router.use(unpin);
export default router;
