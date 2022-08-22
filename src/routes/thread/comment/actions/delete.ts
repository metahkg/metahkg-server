import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { threadCl } from "../../../../common";
import regex from "../../../../lib/regex";
import Thread from "../../../../models/thread";
import requireAdmin from "../../../../plugins/requireAdmin";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
        cid: Type.RegEx(regex.integer),
    });

    fastify.delete(
        "/:cid",
        { schema: { params: paramsSchema }, preHandler: [requireAdmin] },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);

            const index = (
                (await threadCl.findOne(
                    { id, conversation: { $elemMatch: { id: cid } } },
                    {
                        projection: {
                            _id: 0,
                            index: { $indexOfArray: ["$conversation.id", cid] },
                        },
                    }
                )) as Thread & { index: number }
            )?.index;

            // index can be 0
            if (index === undefined || index === -1)
                return res.code(404).send({ error: "Thread or comment not found." });

            await threadCl.updateOne(
                { id },
                { $set: { [`conversation.${index}`]: { id: cid, removed: true } } }
            );

            return res.send({ success: true });
        }
    );
    done();
}
