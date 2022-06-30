import { Static, Type } from "@sinclair/typebox";
import { ajv } from "../../lib/ajv";
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
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const user = verifyUser(req.headers.authorization);

            if (!ajv.validate(schema, req.body) || !user)
                return res.code(400).send({ error: "Bad request." });

            const { userId } = req.body;

            await usersCl.updateOne({ id: user.id }, { $pull: { blocked: userId } });

            return res.send({ response: "ok" });
        }
    );
    done();
};
