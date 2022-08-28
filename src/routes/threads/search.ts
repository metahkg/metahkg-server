import { Static, Type } from "@sinclair/typebox";
import { threadCl } from "../../common";
import Thread from "../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../lib/regex";
import { hiddencats } from "../../lib/hiddencats";
import verifyUser from "../../lib/auth/verify";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const querySchema = Type.Object({
        page: Type.Optional(Type.RegEx(regex.integer)),
        q: Type.String({ maxLength: 100, minLength: 1 }),
        sort: Type.Optional(
            Type.Union(
                ["relevance", "created", "lastcomment"].map((x) => Type.Literal(x))
            )
        ),
        mode: Type.Optional(Type.Union(["title", "op"].map((x) => Type.Literal(x)))),
        limit: Type.Optional(Type.RegEx(regex.oneTo50)),
    });

    fastify.get(
        "/search",
        {
            schema: {
                querystring: querySchema,
            },
        },
        async (
            req: FastifyRequest<{
                Querystring: Static<typeof querySchema>;
            }>,
            res
        ) => {
            const page = Number(req.query.page) || 1;
            const query = decodeURIComponent(String(req.query.q));
            const sort = req.query.sort || "relevance";
            const mode = req.query.mode || "title";
            const limit = Number(req.query.limit) || 25;
            const user = verifyUser(req.headers.authorization);

            const regex = new RegExp(
                query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
                "i"
            );

            const data = (await threadCl
                .aggregate(
                    [
                        {
                            $match: {
                                ...(mode === "op"
                                    ? { "op.name": regex }
                                    : { title: regex }),
                                ...(!user && { category: { $nin: await hiddencats() } }),
                                removed: { $ne: true },
                            },
                        },
                        mode === "title" && {
                            $unionWith: {
                                coll: "thread",
                                pipeline: [
                                    {
                                        $match: {
                                            $text: {
                                                $search: query,
                                            },
                                        },
                                    },
                                    {
                                        $sort: {
                                            title: { $meta: "textScore" },
                                        },
                                    },
                                ],
                            },
                        },
                        { $group: { _id: "$_id", doc: { $first: "$$ROOT" } } },
                        {
                            $replaceRoot: {
                                newRoot: "$doc",
                            },
                        },
                        {
                            created: { $sort: { createdAt: -1 } },
                            lastcomment: { $sort: { lastModified: -1 } },
                        }[sort],
                        { $skip: (page - 1) * limit },
                        { $limit: limit },
                        { $project: { _id: 0, conversation: 0, images: 0, pin: 0 } },
                    ].filter((x) => x)
                )
                .toArray()) as Thread[];

            res.send(data);
        }
    );
    done();
};
