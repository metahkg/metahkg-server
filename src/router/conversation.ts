import express from "express";
import threads from "./conversation/threads";
import comment from "./conversation/comment";
import create from "./conversation/create";
import checkexist from "./conversation/checkexist";
const router = express.Router();
router.use(threads);
router.use(comment);
router.use(create);
router.use(checkexist);
export default router;
