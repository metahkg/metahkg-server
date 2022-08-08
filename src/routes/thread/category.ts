import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { categoryCl, threadCl } from "../../common";
import regex from "../../lib/regex";
import Category from "../../models/category";
import Thread from "../../models/thread";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    fastify.get(
        "/:id/category",
        { schema: { params: paramsSchema } },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const id = Number(req.params.id);

            const category = (await categoryCl.findOne({
                id: (
                    (await threadCl.findOne(
                        {
                            id,
                        },
                        { projection: { _id: 0, id: 1 } }
                    )) as Thread
                ).id,
            })) as Category;

            if (!category) return res.send("Not found.")

            res.send(category);
        }
    );
    done();
}
