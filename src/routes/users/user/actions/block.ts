import { Static, Type } from "@sinclair/typebox";
import verifyUser from "../../../../lib/auth/verify";
import { usersCl } from "../../../../lib/common";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../../lib/regex";

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
        "/block",
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
            const user = await verifyUser(req.headers.authorization, req.ip);
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

            const userId = Number(req.params.id);
            const { reason } = req.body;

            if (!(await usersCl.findOne({ id: userId })))
                return res.code(404).send({ statusCode: 404, error: "User not found." });

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
                return res
                    .code(409)
                    .send({ statusCode: 409, error: "User already blocked." });

            return res.send({ success: true });
        }
    );
    done();
};
