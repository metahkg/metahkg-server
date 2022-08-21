import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { threadCl } from "../../../common";
import regex from "../../../lib/regex";
import Thread from "../../../models/thread";

export default function emotions(
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
        cid: Type.RegEx(regex.integer),
    });

    fastify.get(
        "/:cid/emotions",
        { schema: { params: paramsSchema } },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);

            const comment = (
                (await threadCl.findOne(
                    {
                        id,
                        conversation: { $elemMatch: { id: cid } },
                    },
                    {
                        projection: {
                            _id: 1,
                            conversation: { $elemMatch: { id: cid } },
                        },
                    }
                )) as Thread
            )?.conversation?.[0];

            if (!comment)
                return res.code(404).send({ error: "Thread or comment not found." });

            res.send(comment?.emotions || []);
        }
    );
    done();
}
