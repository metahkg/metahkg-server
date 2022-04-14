import { Router } from "express";
import { createToken } from "../../lib/auth/createtoken";
import verifyUser from "../../lib/auth/verify";
import { decode } from "jsonwebtoken";

const router = Router();
router.use((req, res, next) => {
    const token = req.headers.authorization;
    const user = verifyUser(token);
    if (user) {
        const { exp } = decode(token) as {
            exp: number;
        };
        if (new Date(exp).getTime() - 60 * 60 * 24 * 7 < new Date().getTime() - 60 * 60)
            res.setHeader("token", createToken(user.id, user.name, user.sex, user.role));
    }
    next();
});

export default router;
