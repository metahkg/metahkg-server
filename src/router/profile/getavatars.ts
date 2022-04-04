import { Router } from "express";
import isInteger from "is-sn-integer";
import { error400 } from "../lib/errors/400";
import fs from "fs";
const router = Router();
router.get("/api/avatars/:id", async (req, res) => {
  if (!isInteger(req.params.id)) {
    error400(res);
    return;
  }
  const filename = `images/avatars/${req.params.id}.png`;
  res.setHeader('Content-Type', 'image/png');
  fs.stat(filename, (err) => {
    if (!err) res.sendFile(`${process.env.root}/${filename}`);
    else res.sendFile(`${process.env.root}/static/images/noavatar.png`);
  });
});
export default router;
