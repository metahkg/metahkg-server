import { votesCl } from "../../common";
import isInteger from "is-sn-integer";
import verifyUser from "../../lib/auth/verify";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.get(
        "/:id/uservotes",
        async (req: FastifyRequest<{ Params: { id: string } }>, res) => {
            if (!req.params.id || !isInteger(String(req.params.id)))
                return res.code(400).send({ error: "Bad request." });

            const id = Number(req.params.id);

            const user = verifyUser(req.headers.authorization);
            if (!user) return res.code(401).send({ error: "Unauthorized" });

            const userVotes = await votesCl.findOne(
                { id: user.id },
                { projection: { [id]: 1, _id: 0 } }
            );

            res.send(userVotes?.[id] || {});
        }
    );
    done();
};
