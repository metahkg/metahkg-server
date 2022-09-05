import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { categoryCl, threadCl } from "../../../common";
import verifyUser from "../../../lib/auth/verify";
import regex from "../../../lib/regex";
import checkThread from "../../../plugins/checkThread";
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
            title: Type.Optional(Type.String({ maxLength: 100 })),
            category: Type.Optional(Type.Integer({ minimum: 1 })),
            reason: Type.String(),
        },
        { additionalProperties: false, minProperties: 2 }
    );

    fastify.patch(
        "/:id",
        {
            schema: { params: paramsSchema, body: schema },
            preHandler: [requireAdmin, checkThread],
        },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);

            const user = verifyUser(req.headers.authorization);

            const { category, title, reason } = req.body;

            if (category && !(await categoryCl.findOne({ id: category })))
                return res.code(404).send({ error: "Category not found" });

            await threadCl.updateOne(
                { id },
                {
                    $set: {
                        ...(category && { category }),
                        ...(title && { title }),
                    },
                    $push: {
                        "admin.edits": {
                            admin: user,
                            reason,
                            date: new Date(),
                        },
                    },
                }
            );

            return res.send({ success: true });
        }
    );
    done();
}
