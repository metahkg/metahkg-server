import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../lib/regex";
import { gamesCl } from "../../lib/common";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    const querySchema = Type.Object(
        {
            page: Type.Optional(Type.RegEx(regex.integer)),
            sort: Type.Optional(
                Type.Union([
                    Type.Literal("latest"),
                    Type.Literal("oldest"),
                    Type.Literal("popular"),
                ]),
            ),
            limit: Type.Optional(Type.RegEx(regex.oneTo50)),
        },
        { additionalProperties: false },
    );
    fastify.get(
        "/",
        { schema: { querystring: querySchema } },
        async (req: FastifyRequest<{ Querystring: Static<typeof querySchema> }>, res) => {
            const page = Number(req.query.page || 1);
            const sort = req.query.sort || "latest";
            const limit = Number(req.query.limit || 25);

            const games = await gamesCl
                .find({
                    ...(sort === "popular" && {
                        lastModified: {
                            $gt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
                        },
                    }),
                })
                .sort(sort === "oldest" ? { lastModified: 1 } : { lastModified: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .toArray();

            res.send(games);
        },
    );
    done();
}
