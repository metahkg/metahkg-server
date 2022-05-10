import body_parser from "body-parser";
import express from "express";
import { threadCl, votesCl } from "../../common";
import { Type, Static } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import verifyUser from "../../lib/auth/verify";
import Thread from "../../models/thread";

const router = express.Router();

const schema = Type.Object(
    {
        id: Type.Integer({ minimum: 1 }),
        cid: Type.Integer({ minimum: 1 }),
        vote: Type.Union([Type.Literal("U"), Type.Literal("D")]),
    },
    { additionalProperties: false },
);

router.post(
    "/api/posts/vote",
    body_parser.json(),
    async (
        req: { body: Static<typeof schema>; headers: { authorization?: string } },
        res,
    ) => {
        if (!ajv.validate(schema, req.body))
            return res.status(400).send({ error: "Bad request." });

        const user = verifyUser(req.headers.authorization);

        if (!user) return res.status(400).send({ error: "User not found." });

        const thread = (await threadCl.findOne(
            { id: req.body.id },
            {
                projection: {
                    _id: 0,
                    conversation: {
                        $filter: {
                            input: "$conversation",
                            cond: {
                                $and: [
                                    {
                                        $gte: ["$$this.id", req.body.cid],
                                    },
                                    { $lte: ["$$this.id", req.body.cid] },
                                ],
                            },
                        },
                    },
                },
            },
        )) as Thread;

        if (!thread) return res.status(404).send({ error: "Thread not found." });

        const index = req.body.cid - 1;
        const uservotes = await votesCl.findOne({ id: user.id });

        if (!uservotes) {
            await votesCl.insertOne({ id: user.id });
        } else if (uservotes?.[req.body.id]?.[req.body.cid]) {
            return res.status(403).send({ error: "You have already voted." });
        }

        await votesCl.updateOne(
            { id: user.id },
            { $set: { [`${req.body.id}.${req.body.cid}`]: req.body.vote } },
        );

        if (!thread.conversation[0]?.[req.body.vote]) {
            await threadCl.updateOne(
                { id: req.body.id },
                { $set: { [`conversation.${index}.${req.body.vote}`]: 0 } },
            );
        }

        await threadCl.updateOne(
            { id: req.body.id },
            { $inc: { [`conversation.${index}.${req.body.vote}`]: 1 } },
        );

        if (req.body.cid === 1) {
            await threadCl.updateOne(
                { id: req.body.id },
                { $inc: { vote: req.body.vote === "U" ? 1 : -1 } },
            );
        }

        res.send({ response: "ok" });
    },
);

export default router;
