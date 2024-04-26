import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { PollIdSchema } from "../../../lib/schemas";
import { checkPoll } from "../../../plugins/checkPoll";
import { pollsCl } from "../../../lib/common";
import { Poll } from "../../../models/polls";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: PollIdSchema,
    });
    fastify.get(
        "/polls/:id",
        { schema: { params: paramsSchema }, preParsing: [checkPoll] },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const { id } = req.params;
            const poll = (await pollsCl.findOne(
                {
                    id,
                    votes: {
                        $elemMatch: {
                            "user.id": req.user.id,
                        },
                    },
                },
                {
                    projection: {
                        votes: {
                            $filter: {
                                input: "$votes",
                                cond: {
                                    $eq: ["$$this.user.id", req.user.id],
                                },
                            },
                        },
                    },
                }
            )) as Poll | null;

            const vote = poll?.votes?.[0];

            if (!vote) {
                return res.code(404).send({ statusCode: 404, error: "Vote not found." });
            }

            return res.send(vote);
        }
    );
    done();
}
