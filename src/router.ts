import express from "express";
import account from "./router/users";
import categories from "./router/category";
import posts from "./router/posts";
import search from "./router/search";
import vote from "./router/posts/vote";
import profile from "./router/profile";
import menu from "./router/menu/menu";
import threads from "./router/menu/threads";

const router = express.Router();

router.use(account);
router.use(categories);
router.use(posts);
router.use(search);
router.use(vote);
router.use(profile);
router.use(menu);
router.use(threads);

export default router;
