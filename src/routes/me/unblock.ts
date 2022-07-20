import { Static, Type } from "@sinclair/typebox";
import verifyUser from "../../lib/auth/verify";
import { usersCl } from "../../common";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const schema = Type.Object({
        userId: Type.Integer({ minimum: 1 }),
    });

    fastify.post(
        "/unblock",
        { schema: { body: schema } },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const user = verifyUser(req.headers.authorization);

            if (!user) return res.code(401).send({ error: "Unauthorized" });

            const { userId } = req.body;

            if (
                !(await usersCl.updateOne(
                    { id: user.id, blocked: userId },
                    { $pull: { blocked: userId } }
                ))
            )
                return res.code(409).send({ error: "User not blocked." });

            return res.send({ response: "ok" });
        }
    );
    done();
};
