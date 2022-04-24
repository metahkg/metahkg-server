//check whether a thread exist
//syntax: POST /api/check {id : number}
import express from "express";

const router = express.Router();
import body_parser from "body-parser";
import { db, threadCl } from "../../common";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import Thread from "../../models/thread";

router.post("/api/posts/check", body_parser.json(), async (req, res) => {
    const schema = Type.Object(
        {
            id: Type.Integer(),
        },
        { additionalProperties: false }
    );
    if (!ajv.validate(schema, req.body))
        return res.status(400).send({ error: "Bad request." });

    if (!((await threadCl.findOne({ id: req.body.id })) as Thread))
        return res.status(404).send({ error: "Not found." });

    res.send({ response: "ok" });
});
export default router;
