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
        "/block",
        {
            schema: {
                body: schema,
            },
        },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const user = verifyUser(req.headers.authorization);
            if (!user) return res.code(401).send({ error: "Unauthorized." });

            const { userId } = req.body;

            await usersCl.updateOne({ id: user.id }, { $push: { blocked: userId } });

            return res.send({ response: "ok" });
        }
    );
    done();
};
