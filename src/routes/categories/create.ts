import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { categoryCl } from "../../common";
import Category from "../../models/category";
import requireAdmin from "../../plugins/requireAdmin";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const schema = Type.Object(
        {
            name: Type.String({ maxLength: 15 }),
            hidden: Type.Optional(Type.Boolean()),
            pinned: Type.Optional(Type.Boolean()),
            tags: Type.Optional(Type.Array(Type.String({ maxLength: 15 }))),
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/",
        { schema: { body: schema }, preHandler: [requireAdmin] },
        async (req: FastifyRequest<{ Body: Static<typeof schema> }>, res) => {
            const { name } = req.body;

            if (await categoryCl.findOne({ name }))
                return res
                    .code(409)
                    .send({ statusCode: 409, error: "Category already exists." });

            const id =
                (
                    (await categoryCl
                        .find()
                        .sort({ id: -1 })
                        .project({ _id: 0, id: 1 })
                        .limit(1)
                        .toArray()) as Category[]
                )[0]?.id + 1 || 1;

            await categoryCl.insertOne({ id, ...req.body });

            return res.send({ success: true });
        }
    );
    done();
}
