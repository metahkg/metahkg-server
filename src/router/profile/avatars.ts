import { Router } from "express";
import isInteger from "is-sn-integer";
import fs from "fs";

const router = Router();
router.get("/api/avatars/:id", async (req, res) => {
    if (!isInteger(req.params.id)) return res.status(400).send({ error: "Bad request." });

    const filename = `images/avatars/${req.params.id}.png`;
    res.setHeader("Content-Type", "image/png");
    fs.stat(filename, (err) => {
        if (!err) res.sendFile(`${process.env.root}/${filename}`);
        else res.sendFile(`${process.env.root}/static/images/noavatar.png`);
    });
});
export default router;
