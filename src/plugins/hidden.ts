import { FastifyReply, FastifyRequest } from "fastify";
import { categoryCl, threadCl } from "../common";
import verifyUser from "../lib/auth/verify";

export default async (
    req: FastifyRequest<{ Params: { id?: string } }>,
    res: FastifyReply
) => {
    if (req.params.id) {
        const id = Number(req.params.id);
        if (!(Number.isInteger(id) && id > 0)) return;
        const hidden = (
            await categoryCl.findOne({
                id: (
                    await threadCl.findOne(
                        { id },
                        { projection: { _id: 0, category: 1 } }
                    )
                ).category,
            })
        ).hidden;
        if (hidden && !verifyUser(req.headers.authorization))
            return res.code(403).send({ error: "Forbidden." });
    }
    return;
};
