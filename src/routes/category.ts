//get categories
//Syntax: GET /api/category/<"all" | number(category id)>
//"all" returns an array of all categories
import { categoryCl, threadCl } from "../common";
import Thread from "../models/thread";
import { Type } from "@sinclair/typebox";
import { ajv } from "../lib/ajv";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    fastify.get("/:id", async (req: FastifyRequest<{ Params: { id: string } }>, res) => {
        const id = Number(req.params.id) || req.params.id;

        const schema = Type.Union([
            Type.Integer({ minimum: 1 }),
            Type.RegEx(/^bytid\d+$/),
        ]);

        if (!ajv.validate(schema, id))
            return res.code(400).send({ error: "Bad request." });

        if (req.params.id?.startsWith("bytid")) {
            const thread = (await threadCl.findOne(
                {
                    id: Number(req.params.id?.replace("bytid", "")),
                },
                { projection: { _id: 0, category: 1 } }
            )) as Thread;

            const category = await categoryCl.findOne(
                { id: thread?.category },
                { projection: { _id: 0 } }
            );

            if (!category) return res.code(404).send({ error: "Not found." });

            return res.send(category);
        }

        const category = await categoryCl.findOne(
            { id: Number(req.params.id) },
            { projection: { _id: 0 } }
        );

        if (!category) return res.code(404).send({ error: "Not found." });

        res.send(category);
    });
    done();
}
