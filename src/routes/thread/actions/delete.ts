import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { threadCl } from "../../../common";
import regex from "../../../lib/regex";
import requireAdmin from "../../../plugins/requireAdmin";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    fastify.delete(
        "/:id",
        { schema: { params: paramsSchema }, preHandler: [requireAdmin] },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const id = Number(req.params.id);

            if (!(await threadCl.deleteOne({ id })).deletedCount)
                return res.code(404).send({ error: "Thread not found." });

            return res.send({ success: true });
        }
    );
    done();
}
