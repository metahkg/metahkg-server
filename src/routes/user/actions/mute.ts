import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { usersCl } from "../../../common";
import { agenda } from "../../../lib/agenda";
import verifyUser from "../../../lib/auth/verify";
import regex from "../../../lib/regex";
import User from "../../../models/user";
import requireAdmin from "../../../plugins/requireAdmin";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    const schema = Type.Object({
        reason: Type.String(),
        exp: Type.Optional(Type.String({ format: "date-time" })),
    });

    fastify.post(
        "/:id/mute",
        { schema: { params: paramsSchema, body: schema }, preHandler: [requireAdmin] },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);
            const admin = verifyUser(req.headers.authorization);
            const { reason, exp } = req.body;

            const reqUser = (await usersCl.findOne({ id })) as User;

            if (!reqUser) return res.status(404).send({ error: "User not found." });

            if (reqUser.role === "admin")
                return res.code(409).send({ error: "Cannot mute an admin." });

            await usersCl.updateOne(
                { id },
                {
                    $set: {
                        mute: {
                            admin,
                            reason,
                            ...(exp && { exp: new Date(exp) }),
                        },
                    },
                }
            );

            if (exp) await agenda.schedule(new Date(exp), "unmuteUser", { userId: id });

            return res.send({ success: true });
        }
    );
    done();
}
