import { Static, Type } from "@sinclair/typebox";
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

    fastify.post(
        "/follow",
        {
            schema: {
                params: paramsSchema,
            },
        },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
            }>,
            res
        ) => {
            const user = req.user;
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

            const userId = Number(req.params.id);

            if (!(await usersCl.findOne({ id: userId })))
                return res.code(404).send({ statusCode: 404, error: "User not found." });

            if (
                !(
                    await usersCl.updateOne(
                        {
                            id: user.id,
                            following: {
                                $not: {
                                    $elemMatch: { id: userId },
                                },
                            },
                        },
                        {
                            $push: {
                                following: { id: userId, date: new Date() },
                            },
                        }
                    )
                ).matchedCount
            )
                return res
                    .code(409)
                    .send({ statusCode: 409, error: "User already followed." });

            return res.send({ success: true });
        }
    );
    done();
};
