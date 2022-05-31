import isInteger from "is-sn-integer";
import fs from "fs";
import { Router } from "express";

const router = Router();

router.get("/api/profile/avatars/:id", async (req, res) => {
    if (!isInteger(req.params.id)) return res.status(400).send({ error: "Bad request." });

    const filename = `images/avatars/${req.params.id}.png`;
    fs.stat(filename, (err) => {
        const path = `${process.env.root}/${
            err ? "static/images/noavatar.png" : filename
        }`;
        res.sendFile(path);
    });
});

export default router;
