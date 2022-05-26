import { Router } from "express";
import { createToken } from "../../lib/auth/createtoken";
import verifyUser from "../../lib/auth/verify";

const router = Router();
router.get("/api/users/status", async (req, res) => {
    if (!req.headers.authorization) return res.send({ signedIn: false });
    const user = verifyUser(req.headers.authorization);
    if (!user) return res.send({ signedIn: false });
    res.send({
        signedIn: true,
        id: user.id,
        name: user.name,
        token: createToken(user.id, user.name, user.sex, user.role),
    });
});
export default router;
