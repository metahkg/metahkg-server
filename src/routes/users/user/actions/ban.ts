import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { usersCl } from "../../../../lib/common";
import { agenda } from "../../../../lib/agenda";
import verifyUser from "../../../../lib/auth/verify";
import regex from "../../../../lib/regex";
import User from "../../../../models/user";
import RequireAdmin from "../../../../plugins/requireAdmin";
import { ReasonSchemaAdmin, DateSchema } from "../../../../lib/schemas";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    const schema = Type.Object(
        {
            reason: ReasonSchemaAdmin,
            exp: Type.Optional(DateSchema),
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/ban",
        { schema: { params: paramsSchema, body: schema }, preHandler: [RequireAdmin] },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);
            const admin = await verifyUser(req.headers.authorization, req.ip);
            const { reason, exp } = req.body;

            const reqUser = (await usersCl.findOne({ id })) as User;

            if (!reqUser)
                return res.code(404).send({ statusCode: 404, error: "User not found." });

            if (reqUser.role === "admin")
                return res
                    .code(409)
                    .send({ statusCode: 409, error: "Cannot ban an admin." });

            await usersCl.updateOne(
                { id },
                {
                    $set: {
                        ban: {
                            admin,
                            reason,
                            ...(exp && { exp: new Date(exp) }),
                        },
                    },
                }
            );

            await agenda.cancel({ name: "unbanUser", data: { userId: id } });
            if (exp) await agenda.schedule(new Date(exp), "unbanUser", { userId: id });

            return res.send({ success: true });
        }
    );
    done();
}
