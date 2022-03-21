import { Router } from "express";
import { client } from "../common";
const router = Router();
router.get("/api/loggedin", async (req, res) => {
  if (!req.cookies.key) {
    res.send({ loggedin: false });
    return;
  }
  const user = await client
    .db("metahkg-users")
    .collection("users")
    .findOne({ key: req.cookies.key });
  if (!user) {
    res.cookie("key", "none", {
      expires: new Date(Date.now() + 1),
      httpOnly: true,
      domain: process.env.domain,
    });
    res.send({ loggedin: false });
    return;
  }
  res.send({ loggedin: true, id: user.id, user: user.user });
});
export default router;
