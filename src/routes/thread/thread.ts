import { threadCl } from "../../common";
import { hiddencats } from "../../lib/hiddencats";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import verifyUser from "../../lib/auth/verify";
import Thread from "../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.get(
        "/:id",
        async (
            req: FastifyRequest<{
                Params: { id: string };
                Querystring: {
                    page?: string;
                    start?: string;
                    end?: string;
                    sort?: string;
                };
            }>,
            res
        ) => {
            const id = Number(req.params.id);
            const page = Number(req.query.page) || 1;
            const start = Number(req.query.start) || (page - 1) * 25 + 1;
            const end = Number(req.query.end) || page * 25;
            const sort = req.query.sort || ("time" as "score" | "time" | "latest");

            const schema = Type.Object(
                {
                    id: Type.Integer(),
                    page: Type.Integer({ minimum: 1 }),
                    start: Type.Integer({ minimum: 1 }),
                    end: Type.Integer({ minimum: start }),
                    sort: Type.Union([
                        Type.Literal("score"),
                        Type.Literal("time"),
                        Type.Literal("latest"),
                    ]),
                },
                { additionalProperties: false }
            );
            if (!ajv.validate(schema, { id, page, start, end, sort }))
                return res.code(400).send({ error: "Bad request." });

            const thread = (
                await threadCl
                    .aggregate([
                        { $match: { id } },
                        {
                            $set: {
                                conversation: {
                                    $filter: {
                                        input: "$conversation",
                                        cond: {
                                            $and: [
                                                { $gte: ["$$this.id", start] },
                                                { $lte: ["$$this.id", end] },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                        {
                            $set: {
                                conversation: {
                                    $map: {
                                        input: "$conversation",
                                        in: {
                                            $mergeObjects: [
                                                "$$this",
                                                {
                                                    score: {
                                                        $subtract: [
                                                            { $ifNull: ["$$this.U", 0] },
                                                            { $ifNull: ["$$this.D", 0] },
                                                        ],
                                                    },
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                        { $unwind: "$conversation" },
                        {
                            $sort: {
                                score: {
                                    "conversation.score": -1,
                                    "conversation.createdAt": 1,
                                },
                                time: { "conversation.createdAt": 1 },
                                latest: { "conversation.createdAt": -1 },
                            }[sort],
                        },
                        {
                            $group: {
                                _id: "$_id",
                                doc: { $first: "$$ROOT" },
                                conversation: { $push: "$conversation" },
                            },
                        },
                        {
                            $replaceRoot: {
                                newRoot: {
                                    $mergeObjects: [
                                        "$doc",
                                        { conversation: "$conversation" },
                                    ],
                                },
                            },
                        },
                        { $project: { _id: 0 } },
                    ])
                    .toArray()
            )[0] as Thread;

            if (!thread) return res.code(404).send({ error: "Not Found" });

            if (
                !verifyUser(req.headers.authorization) &&
                (await hiddencats()).includes(thread.category)
            )
                return res.code(403).send({ error: "Permission denied." });

            res.send(thread);
        }
    );
    done();
};
