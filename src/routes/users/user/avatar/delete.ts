import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import fs from "fs";
import regex from "../../../../lib/regex";
import RequireSameUserOrAdmin from "../../../../plugins/requireSameUserOrAdmin";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    fastify.delete(
        "/",
        { preHandler: [RequireSameUserOrAdmin], schema: { params: paramsSchema } },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const id = Number(req.params.id);
            const filename = `images/avatars/${id}.png`;

            try {
                fs.rmSync(filename);
            } catch {
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Avatar not found." });
            }

            return res.send({ success: true });
        }
    );
    done();
}
