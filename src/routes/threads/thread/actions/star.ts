import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { threadCl, usersCl } from "../../../../lib/common";
import verifyUser from "../../../../lib/auth/verify";
import regex from "../../../../lib/regex";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    fastify.post(
        "/star",
        { schema: { params: paramsSchema } },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const user = await verifyUser(req.headers.authorization, req.ip);
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

            const threadId = Number(req.params.id);

            if (!(await threadCl.findOne({ id: threadId })))
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Thread not found." });

            if (
                !(
                    await usersCl.updateOne(
                        {
                            id: user.id,
                            starred: {
                                $not: {
                                    $elemMatch: { id: threadId },
                                },
                            },
                        },
                        {
                            $push: {
                                starred: {
                                    $each: [{ id: threadId, date: new Date() }],
                                    $position: 0,
                                },
                            },
                        }
                    )
                ).matchedCount
            )
                return res
                    .code(409)
                    .send({ statusCode: 409, error: "Thread already starred." });

            return res.send({ success: true });
        }
    );
    done();
}
