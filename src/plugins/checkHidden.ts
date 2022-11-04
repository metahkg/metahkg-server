import { FastifyReply, FastifyRequest } from "fastify";
import { categoryCl, threadCl } from "../lib/common";

export default async function (
    req: FastifyRequest<{ Params: { id?: string } }>,
    res: FastifyReply
) {
    if (req.params.id) {
        const id = Number(req.params.id);
        if (!(Number.isInteger(id) && id > 0)) return;

        const category = (
            await threadCl.findOne({ id }, { projection: { _id: 0, category: 1 } })
        )?.category;

        if (!category) return;

        const hidden = (
            await categoryCl.findOne({
                id: category,
            })
        )?.hidden;

        if (hidden && !req.user)
            return res.code(403).send({ statusCode: 403, error: "Forbidden." });
    }
    return;
}
