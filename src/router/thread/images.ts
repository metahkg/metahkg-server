import isInteger from "is-sn-integer";
import { imagesCl } from "../../common";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";

export default (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.get(
        "/:id/images",
        async (
            req: FastifyRequest<{ Params: { id: string }; Querystring: { c?: string } }>,
            res
        ) => {
            if (!isInteger(req.params.id))
                return res.status(400).send({ error: "Bad request." });

            const id = Number(req.params.id);
            const cid = Number(req.query.c);

            const result = await imagesCl.findOne(
                { id: id },
                {
                    projection: {
                        _id: 0,
                        images: cid && {
                            $filter: {
                                input: "$images",
                                cond: {
                                    $eq: ["$$this.cid", cid],
                                },
                            },
                        },
                    },
                }
            );
            res.send(result.images);
        }
    );
    done();
};
