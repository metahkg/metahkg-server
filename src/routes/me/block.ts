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
        id: Type.Integer({ minimum: 1 }),
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

            const { id: userId } = req.body;

            if (!(await usersCl.findOne({ id: userId })))
                return res.code(404).send({ error: "User not found." });

            if (
                !(
                    await usersCl.updateOne(
                        {
                            id: user.id,
                            blocked: {
                                $not: {
                                    $eq: userId,
                                },
                            },
                        },
                        { $push: { blocked: userId } }
                    )
                ).matchedCount
            )
                return res.code(409).send({ error: "User already blocked." });

            return res.send({ success: true });
        }
    );
    done();
};
