import { Router } from "express";
import { createToken } from "../../lib/auth/createtoken";
import verifyUser from "../../lib/auth/verify";

const router = Router();
router.get("/api/users/loggedin", async (req, res) => {
    if (!req.cookies.key) return res.send({ loggedin: false });
    const user = verifyUser(req.headers.authorization);
    if (!user) return res.send({ loggedin: false });
    res.send({
        loggedin: true,
        id: user.id,
        name: user.name,
        token: createToken(user.id, user.name, user.sex, user.role),
    });
});
export default router;