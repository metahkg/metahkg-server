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
        "/unfollow",
        { schema: { params: paramsSchema } },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const user = req.user;
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized" });

            const userId = Number(req.params.id);

            if (
                !(
                    await usersCl.updateOne(
                        { id: user.id, following: { $elemMatch: { id: userId } } },
                        { $pull: { following: { id: userId } } }
                    )
                ).matchedCount
            )
                return res
                    .code(409)
                    .send({ statusCode: 409, error: "User not followed." });

            return res.send({ success: true });
        }
    );
    done();
};
