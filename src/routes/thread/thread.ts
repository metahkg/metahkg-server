import { threadCl } from "../../common";
import { Static, Type } from "@sinclair/typebox";
import Thread from "../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../lib/regex";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const querySchema = Type.Object({
        page: Type.Optional(Type.RegEx(regex.integer)),
        start: Type.Optional(Type.RegEx(regex.integer)),
        end: Type.Optional(Type.RegEx(regex.integer)),
        sort: Type.Optional(Type.RegEx(/^(score|time|latest)$/)),
        limit: Type.Optional(Type.RegEx(regex.oneTo50)),
    });

    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    fastify.get(
        "/:id",
        { schema: { params: paramsSchema, querystring: querySchema } },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Querystring: Static<typeof querySchema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 25;
            const start = Number(req.query.start) || (page - 1) * limit + 1;
            const end = Number(req.query.end) || page * limit;
            const sort = (req.query.sort || "time") as "score" | "time" | "latest";

            if (end < start) return res.code(400).send({ error: "Bad request." });

            if (!(await threadCl.findOne({ id })))
                return res.code(404).send({ error: "Thread not found" });

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
                        {
                            $unwind: {
                                path: "$conversation",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
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
                                        {
                                            conversation: {
                                                $ifNull: ["$conversation", []],
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                        { $project: { _id: 0 } },
                    ])
                    .toArray()
            )[0] as Thread;

            res.send(thread);
        }
    );
    done();
};
