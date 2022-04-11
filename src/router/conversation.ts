import express from "express";
import threads from "./conversation/thread";
import comment from "./conversation/comment";
import create from "./conversation/create";
import checkexist from "./conversation/checkexist";
import images from "./conversation/images";

const router = express.Router();
router.use(threads);
router.use(comment);
router.use(create);
router.use(checkexist);
router.use(images);
export default router;
