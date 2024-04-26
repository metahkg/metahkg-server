import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { pollsCl } from "../../lib/common";
import { Poll } from "../../models/polls";
import RequireAuth from "../../plugins/requireAuth";
import { objectFilter } from "../../lib/objectFilter";
import { publicUserType } from "../../models/thread";
import { checkPoll } from "../../plugins/checkPoll";
import { PollIdSchema } from "../../lib/schemas";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const schema = Type.Object(
        {
            option: Type.Integer({ minimum: 0, maximum: 5 }),
        },
        { additionalProperties: false }
    );

    const paramsSchema = Type.Object({
        id: PollIdSchema,
    });

    fastify.post(
        "/:id/vote",
        {
            schema: { body: schema, params: paramsSchema },
            preParsing: [RequireAuth],
            preHandler: [checkPoll],
        },
        async (
            req: FastifyRequest<{
                Body: Static<typeof schema>;
                Params: Static<typeof paramsSchema>;
            }>,
            res
        ) => {
            const { option } = req.body;
            const { id } = req.params;

            const poll = (await pollsCl.findOne({
                id,
            })) as Poll;

            if (poll.endsAt && new Date(poll.endsAt).getTime() < new Date().getTime()) {
                return res.code(410).send({
                    statusCode: 410,
                    error: "Poll ended",
                });
            }

            await pollsCl.updateOne(
                { id },
                {
                    $push: {
                        votes: {
                            user: objectFilter(req.user, (key: string) =>
                                ["id", "name", "sex", "role"].includes(key)
                            ) as publicUserType,
                            option,
                            date: new Date(),
                        },
                    },
                    $inc: {
                        [`options.${option}.votes`]: 1,
                    },
                    $currentDate: { lastModified: true },
                }
            );

            return res.code(204).send();
        }
    );
    done();
}
