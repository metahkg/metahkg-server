import { Router } from "express";
import { db } from "../common";
import { createToken } from "./auth/createtoken";
import verifyUser from "./auth/verify";

const router = Router();
router.get("/api/loggedin", async (req, res) => {
    if (!req.cookies.key) return res.send({ loggedin: false });
    const user = verifyUser(req.headers.authorization);
    if (!user) return res.send({ loggedin: false });
    res.send({
        loggedin: true,
        id: user.id,
        user: user.user,
        token: createToken(user.id, user.user, user.sex, user.role),
    });
});
export default router;
