import { categoryCl } from "../../common";
import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../lib/regex";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    fastify.get(
        "/:id",
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const id = Number(req.params.id);

            const category = await categoryCl.findOne({ id }, { projection: { _id: 0 } });

            if (!category)
                return res.code(404).send({ statusCode: 404, error: "Not found." });

            res.send(category);
        }
    );
    done();
}
