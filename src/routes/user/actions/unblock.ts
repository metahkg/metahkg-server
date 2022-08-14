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

    fastify.post(
        "/:id/unblock",
        { schema: { params: paramsSchema } },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const user = verifyUser(req.headers.authorization);
            if (!user) return res.code(401).send({ error: "Unauthorized" });

            const userId = Number(req.params.id);

            if (
                !(
                    await usersCl.updateOne(
                        { id: user.id, blocked: { $elemMatch: { id: userId } } },
                        { $pull: { blocked: { $elemMatch: { id: userId } } } }
                    )
                ).matchedCount
            )
                return res.code(409).send({ error: "User not blocked." });

            return res.send({ success: true });
        }
    );
    done();
};
