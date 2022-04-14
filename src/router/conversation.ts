import express from "express";
import threads from "./posts/thread";
import comment from "./posts/comment";
import create from "./posts/create";
import checkexist from "./posts/checkexist";
import images from "./posts/images";

const router = express.Router();
router.use(threads);
router.use(comment);
router.use(create);
router.use(checkexist);
router.use(images);
export default router;
