import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { usersCl } from "../../../../lib/common";
import { agenda } from "../../../../lib/agenda";
import regex from "../../../../lib/regex";
import User from "../../../../models/user";
import RequireAdmin from "../../../../plugins/requireAdmin";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    fastify.post(
        "/unmute",
        { schema: { params: paramsSchema }, preHandler: [RequireAdmin] },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const id = Number(req.params.id);

            const reqUser = (await usersCl.findOne({ id })) as User;

            if (!reqUser)
                return res.code(404).send({ statusCode: 404, error: "User not found." });

            if (!reqUser.mute)
                return res.code(409).send({ statusCode: 409, error: "User not muted." });

            await usersCl.updateOne({ id }, { $unset: { mute: 1 } });

            await agenda.cancel({ name: "unmuteUser", data: { userId: id } });

            return res.send({ success: true });
        }
    );
    done();
}
