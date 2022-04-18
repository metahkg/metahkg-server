/**
 * get conversation
 * Syntax: GET /api/thread/<thread id>/<"conversation"/"users">
 * conversation: main conversation content
 * users: content of users involved in the conversation
 */
import express from "express";

const router = express.Router();
import { conversationCl, summaryCl, usersCl } from "../../common";
import { hiddencats } from "../../lib/hiddencats";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import verifyUser from "../../lib/auth/verify";

/**
 * type:
 *  0: users
 *  1: details
 *  2: conversation
 * default type is 1
 */
router.get("/api/thread/:id", async (req, res) => {
    const id = Number(req.params.id);
    const page = Number(req.query.page) || 1;
    const start = Number(req.query.start);
    const end = Number(req.query.end);
    const schema = Type.Object(
        {
            id: Type.Integer(),
            page: Type.Integer({ minimum: 1 }),
            start: Type.Optional(Type.Integer()),
            end: Type.Optional(Type.Integer()),
        },
        { additionalProperties: false }
    );
    if (
        !ajv.validate(schema, {
            id: id,
            page: page,
            start: start || undefined,
            end: end || undefined,
        }) ||
        (start &&
            (start > end ||
                (!end && (start < (page - 1) * 25 + 1 || start > page * 25)))) ||
        (end &&
            (end < start || (!start && (end > page * 25 || end < (page - 1) * 25 + 1))))
    ) {
        return res.status(400).send({ error: "Bad request." });
    }
    const summaryData = await summaryCl.findOne(
        { id: Number(req.params.id) },
        {
            projection: {
                _id: 0,
            },
        }
    );

    if (!summaryData) return res.status(404).send({ error: "Not Found" });

    if (
        !verifyUser(req.headers.authorization) &&
        (await hiddencats()).includes(summaryData.category)
    )
        return res.status(401).send({ error: "Permission denied." });

    const conversationData = await conversationCl.findOne(
        { id: Number(req.params.id) },
        {
            projection: {
                _id: 0,
                conversation: {
                    $filter: {
                        input: "$conversation",
                        cond: {
                            $and: [
                                {
                                    $gte: [
                                        "$$this.id",
                                        Number(req.query.start) || (page - 1) * 25 + 1,
                                    ],
                                },
                                {
                                    $lte: [
                                        "$$this.id",
                                        Number(req.query.end) || page * 25,
                                    ],
                                },
                            ],
                        },
                    },
                },
            },
        }
    );

    const thread = Object.assign(conversationData, summaryData);

    for (let i = 0; i < thread?.conversation?.length; i++) {
        thread.conversation[i].user = await usersCl.findOne(
            {
                id: thread.conversation[i].user,
            },
            {
                projection: {
                    _id: 0,
                    name: 1,
                    id: 1,
                    role: 1,
                    sex: 1,
                },
            }
        );
    }

    res.send(thread);
});
export default router;