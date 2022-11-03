import { FastifyReply, FastifyRequest } from "fastify";
import { categoryCl, threadCl } from "../lib/common";
import verifyUser from "../lib/auth/verify";

export default async (
    req: FastifyRequest<{ Params: { id?: string } }>,
    res: FastifyReply
) => {
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

        if (hidden && !(await verifyUser(req.headers.authorization, req.ip)))
            return res.code(403).send({ statusCode: 403, error: "Forbidden." });
    }
    return;
};
