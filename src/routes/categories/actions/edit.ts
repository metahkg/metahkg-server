import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { categoryCl } from "../../../common";
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

    const schema = Type.Object(
        {
            name: Type.Optional(Type.String({ maxLength: 15 })),
            tags: Type.Optional(Type.Array(Type.String({ maxLength: 15 }))),
            pinned: Type.Optional(Type.Boolean()),
        },
        { additionalProperties: false, minProperties: 1 }
    );

    fastify.patch(
        "/:id",
        { schema: { params: paramsSchema, body: schema }, preHandler: [requireAdmin] },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);

            if (!(await categoryCl.updateOne({ id }, { $set: req.body })).matchedCount)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Category not found." });

            return res.send({ success: true });
        }
    );
    done();
}
