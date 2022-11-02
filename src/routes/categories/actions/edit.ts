import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { categoryCl } from "../../../lib/common";
import regex from "../../../lib/regex";
import { CategoryNameSchema, CategoryTagsSchema } from "../../../lib/schemas";
import RequireAdmin from "../../../plugins/requireAdmin";

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
            name: Type.Optional(CategoryNameSchema),
            tags: Type.Optional(CategoryTagsSchema),
            pinned: Type.Optional(Type.Boolean()),
        },
        { additionalProperties: false, minProperties: 1 }
    );

    fastify.patch(
        "/:id",
        { schema: { params: paramsSchema, body: schema }, preHandler: [RequireAdmin] },
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
