import { votesCl } from "../../common";
import verifyUser from "../../lib/auth/verify";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import regex from "../../lib/regex";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    fastify.get(
        "/votes/:id",
        {
            schema: {
                params: paramsSchema,
            },
        },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const threadId = Number(req.params.id);

            const user = verifyUser(req.headers.authorization);
            if (!user) return res.code(401).send({ error: "Unauthorized" });

            const userVotes = await votesCl.findOne(
                { id: user.id },
                { projection: { [threadId]: 1, _id: 0 } }
            );

            res.send(userVotes?.[threadId] || {});
        }
    );
    done();
};
