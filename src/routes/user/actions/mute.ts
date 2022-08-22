import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { usersCl } from "../../../common";
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

    fastify.post(
        "/:id/mute",
        { schema: { params: paramsSchema }, preHandler: [requireAdmin] },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const id = Number(req.params.id);

            const reqUser = (await usersCl.findOne({ id })) as User;

            if (!reqUser) return res.status(404).send({ error: "User not found." });

            if (reqUser.role === "admin")
                return res.code(409).send({ error: "Cannot mute an admin." });

            await usersCl.updateOne({ id }, { $set: { muted: true } });

            return res.send({ success: true });
        }
    );
    done();
}
