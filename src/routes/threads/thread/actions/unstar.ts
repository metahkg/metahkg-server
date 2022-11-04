import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { threadCl, usersCl } from "../../../../lib/common";

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
        "/unstar",
        { schema: { params: paramsSchema } },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const user = req.user;
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
                        { id: user.id, starred: { $elemMatch: { id: threadId } } },
                        { $pull: { starred: { id: threadId } } }
                    )
                ).matchedCount
            )
                return res
                    .code(409)
                    .send({ statusCode: 409, error: "Thread not starred." });

            return res.send({ success: true });
        }
    );
    done();
}
