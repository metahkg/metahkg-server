import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { checkPoll as checkPoll } from "../../plugins/checkPoll";
import { Type } from "@sinclair/typebox";
import { PollIdSchema } from "../../lib/schemas";
import { pollsCl } from "../../lib/common";
import { Poll } from "../../models/polls";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    const paramsSchema = Type.Object({
        id: PollIdSchema,
    });
    fastify.get(
        "/:id",
        { schema: { params: paramsSchema }, preHandler: [checkPoll] },
        async (req, res) => {
            const { id } = req.params;
            const poll = (await pollsCl.findOne(
                { id },
                {
                    projection: {
                        _id: 0,
                        id: 1,
                        user: 1,
                        createdAt: 1,
                        lastModified: 1,
                        endsAt: 1,
                        title: 1,
                        options: 1,
                    },
                },
            )) as Poll;

            if (!poll) {
                return res.code(404).send({ statusCode: 404, error: "Poll not found" });
            }

            return res.send(poll);
        },
    );
    done();
}
