/**
 * get conversation
 * Syntax: GET /api/thread/<thread id>/<"conversation"/"users">
 * conversation: main conversation content
 * users: content of users involved in the conversation
 */
import { threadCl } from "../../common";
import { hiddencats } from "../../lib/hiddencats";
import { Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
import verifyUser from "../../lib/auth/verify";
import Thread from "../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    /**
     * type:
     *  0: users
     *  1: details
     *  2: conversation
     * default type is 1
     */
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
                    (end < start ||
                        (!start && (end > page * 25 || end < (page - 1) * 25 + 1))))
            ) {
                return res.code(400).send({ error: "Bad request." });
            }

            const thread = (await threadCl.findOne(
                { id: id },
                {
                    projection: {
                        id: 1,
                        category: 1,
                        title: 1,
                        slink: 1,
                        lastModified: 1,
                        c: 1,
                        createdAt: 1,
                        op: 1,
                        pin: 1,
                        conversation: {
                            $filter: {
                                input: "$conversation",
                                cond: {
                                    $and: [
                                        {
                                            $gte: [
                                                "$$this.id",
                                                start || (page - 1) * 25 + 1,
                                            ],
                                        },
                                        {
                                            $lte: ["$$this.id", end || page * 25],
                                        },
                                    ],
                                },
                            },
                        },
                    },
                }
            )) as Thread;

            if (!thread) return res.code(404).send({ error: "Not Found" });

            if (req.query.sort === "vote") {
                thread.conversation = thread.conversation.sort(function (a, b) {
                    // use 0 if upvote or down vote is undefined
                    return (b.U || 0 - b.D || 0) - (a.U || 0 - a.D || 0);
                });
            }

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