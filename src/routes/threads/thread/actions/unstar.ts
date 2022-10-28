import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { threadCl, usersCl } from "../../../../common";
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
        "/unstar",
        { schema: { params: paramsSchema } },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const user = await verifyUser(req.headers.authorization, req.ip);
            if (!user) return res.code(401).send({ error: "Unauthorized." });

            const threadId = Number(req.params.id);

            if (!(await threadCl.findOne({ id: threadId })))
                return res.code(404).send({ error: "Thread not found." });

            if (
                !(
                    await usersCl.updateOne(
                        { id: user.id, starred: { $elemMatch: { id: threadId } } },
                        { $pull: { starred: { id: threadId } } }
                    )
                ).matchedCount
            )
                return res.code(409).send({ error: "Thread not starred." });

            return res.send({ success: true });
        }
    );
    done();
}
