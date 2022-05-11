import { Router } from "express";
import Thread from "../../../models/thread";
import { threadCl } from "../../../common";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../../lib/ajv";

const router = Router();

router.get("/api/posts/thread/:id/comment/:cid", async (req, res) => {
    const id = Number(req.params.id);
    const cid = Number(req.params.cid);

    const schema = Type.Object({
        id: Type.Integer({ minimum: 1 }),
        cid: Type.Integer({ minimum: 1 }),
    });

    if (!ajv.validate(schema, { id, cid }))
        return res.status(400).send({ error: "Bad request." });

    const thread = (await threadCl.findOne(
        { id: id },
        {
            projection: {
                _id: 0,
                conversation: {
                    $filter: {
                        input: "$conversation",
                        cond: {
                            $eq: ["$$this.id", cid],
                        },
                    },
                },
            },
        }
    )) as Thread;

    const comment = thread?.conversation?.[0];

    if (!comment) return res.status(404).send({ error: "Not found." });

    res.send(comment);
});

export default router;
