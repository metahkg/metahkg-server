import express from "express";
import account from "./router/account";
import categories from "./router/categories";
import conversation from "./router/conversation";
import logout from "./router/logout";
import loggedin from "./router/loggedin";
import search from "./router/search";
import vote from "./router/vote/vote";
import getvotes from "./router/vote/getvotes";
import profile from "./router/profile";
import menu from "./router/menu/menu";
import threads from "./router/menu/threads";
const router = express.Router();
router.use(account);
router.use(categories);
router.use(conversation);
router.use(logout);
router.use(loggedin);
router.use(search);
router.use(vote);
router.use(getvotes);
router.use(profile);
router.use(menu);
router.use(threads);
export default router;
