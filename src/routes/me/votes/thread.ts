import { votesCl } from "../../../common";
import verifyUser from "../../../lib/auth/verify";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import regex from "../../../lib/regex";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    fastify.get(
        "/threads/:id",
        {
            schema: {
                params: paramsSchema,
            },
        },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const threadId = Number(req.params.id);

            const user = await verifyUser(req.headers.authorization, req.ip);
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

            const votes = await votesCl.findOne(
                { id: user.id },
                { projection: { [threadId]: 1, _id: 0 } }
            );

            res.send(votes?.[threadId] || []);
        }
    );
    done();
};
