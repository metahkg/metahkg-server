//check whether a thread exist
//syntax: POST /api/check {id : number}
import express from "express";
const router = express.Router();
import body_parser from "body-parser";
import isInteger from "is-sn-integer";
import { client } from "../../common";
router.post("/api/check", body_parser.json(), async (req, res) => {
  if (
    !req.body.id ||
    Object.keys(req.body)?.length > 1 ||
    typeof req.body.id !== "number" ||
    !isInteger(req.body.id)
  ) {
    res.status(400);
    res.send({ error: "Bad request." });
    return;
  }
    if (
      !(await client
        .db("metahkg-threads")
        .collection("conversation")
        .findOne({ id: req.body.id }))
    ) {
      res.status(404);
      res.send({ error: "Not found." });
      return;
    }
    res.send({ response : "ok" });
});
export default router;
