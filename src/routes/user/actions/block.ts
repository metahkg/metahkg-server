import { Static, Type } from "@sinclair/typebox";
import verifyUser from "../../../lib/auth/verify";
import { usersCl } from "../../../common";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../lib/regex";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    const schema = Type.Object(
        {
            reason: Type.String({ minLength: 0, maxLength: 50 }),
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/:id/block",
        {
            schema: {
                params: paramsSchema,
                body: schema,
            },
        },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) => {
            const user = verifyUser(req.headers.authorization);
            if (!user) return res.code(401).send({ error: "Unauthorized." });

            const userId = Number(req.params.id);
            const { reason } = req.body;

            if (!(await usersCl.findOne({ id: userId })))
                return res.code(404).send({ error: "User not found." });

            if (
                !(
                    await usersCl.updateOne(
                        {
                            id: user.id,
                            blocked: {
                                $not: {
                                    $elemMatch: { id: userId },
                                },
                            },
                        },
                        {
                            $push: {
                                blocked: { id: userId, date: new Date(), reason },
                            },
                        }
                    )
                ).matchedCount
            )
                return res.code(409).send({ error: "User already blocked." });

            return res.send({ success: true });
        }
    );
    done();
};
