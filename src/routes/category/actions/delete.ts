import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { categoryCl, removedCl } from "../../../common";
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
        },
        { additionalProperties: false }
    );

    fastify.delete(
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

            const category = await categoryCl.findOne({ id }, { projection: { _id: 0 } });

            if (!category) return res.code(404).send({ error: "Category not found." });

            await removedCl.insertOne({ type: "category", category });

            await categoryCl.deleteOne({ id });

            return res.send({ success: true });
        }
    );
    done();
}
