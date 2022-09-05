import User from "../../models/user";
import { threadCl, usersCl } from "../../common";
import verifyUser from "../../lib/auth/verify";
import Thread from "../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import regex from "../../lib/regex";
import { hiddencats } from "../../lib/hiddencats";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const querySchema = Type.Object({
        sort: Type.Optional(
            Type.Union([Type.Literal("created"), Type.Literal("lastcomment")])
        ),
        page: Type.Optional(Type.RegEx(regex.integer)),
        limit: Type.Optional(Type.RegEx(regex.oneTo50)),
    });

    const paramsSchema = Type.Object({
        id: Type.RegEx(/^([1-9]\d*|self)$/),
    });

    fastify.get(
        "/:id/threads",
        { schema: { params: paramsSchema, querystring: querySchema } },
        async (
            req: FastifyRequest<{
                Querystring: Static<typeof querySchema>;
                Params: Static<typeof paramsSchema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id) || req.params.id;
            const page = Number(req.query.page) || 1;
            const sort = req.query.sort || "created";
            const limit = Number(req.query.limit) || 25;
            const user = verifyUser(req.headers.authorization);

            const requestedUser = (await usersCl.findOne({ id })) as User;

            if (!requestedUser) return res.code(404).send({ error: "User not found." });

            const history = (await threadCl
                .find({
                    "op.id": requestedUser.id,
                    ...(!user && { category: { $nin: await hiddencats() } }),
                    removed: { $ne: true },
                })
                .sort({
                    ...(sort === "created" && { createdAt: -1 }),
                    ...(sort === "lastcomment" && { lastModified: -1 }),
                })
                .skip(limit * (page - 1))
                .limit(limit)
                .project({ _id: 0, conversation: 0, images: 0, pin: 0 })
                .toArray()) as Thread[];

            res.send(history);
        }
    );
    done();
};
