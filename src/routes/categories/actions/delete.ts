import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { categoryCl, removedCl } from "../../../lib/common";
import regex from "../../../lib/regex";
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
            name: Type.Optional(Type.String({ maxLength: 15 })),
            tags: Type.Optional(Type.Array(Type.String({ maxLength: 15 }))),
        },
        { additionalProperties: false }
    );

    fastify.delete(
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

            const category = await categoryCl.findOne({ id }, { projection: { _id: 0 } });

            if (!category)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Category not found." });

            await removedCl.insertOne({ type: "category", category });

            await categoryCl.deleteOne({ id });

            return res.send({ success: true });
        }
    );
    done();
}
