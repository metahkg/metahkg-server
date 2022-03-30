//check whether a thread exist
//syntax: POST /api/check {id : number}
import express from "express";
const router = express.Router();
import body_parser from "body-parser";
import isInteger from "is-sn-integer";
import { client } from "../../common";
import { Type } from "@sinclair/typebox";
import { ajv } from "../lib/ajv";
router.post("/api/check", body_parser.json(), async (req, res) => {
  const schema = Type.Object(
    {
      id: Type.Integer(),
    },
    { additionalProperties: false }
  );
  if (!ajv.validate(schema, req.body)) {
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
  res.send({ response: "ok" });
});
export default router;
