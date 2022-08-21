import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { threadCl, usersCl } from "../../../../common";
import regex from "../../../../lib/regex";
import { Emotion } from "../../../../models/thread";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
        cid: Type.RegEx(regex.integer),
        emotion: Type.RegEx(regex.emoji),
    });

    fastify.get(
        "/:emotion/users",
        { schema: { params: paramsSchema } },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);
            const { emotion } = req.params;

            const emotions = (
                await threadCl
                    .aggregate([
                        { $match: { id, conversation: { $elemMatch: { id: cid } } } },
                        {
                            $project: {
                                _id: 0,
                                conversation: {
                                    $filter: {
                                        input: "$conversation",
                                        cond: { $eq: ["$$this.id", cid] },
                                    },
                                },
                            },
                        },
                        {
                            $unwind: {
                                path: "$conversation",
                                preserveNullAndEmptyArrays: true,
                            },
                        },
                        { $set: { emotions: "$conversation.emotions" } },
                        {
                            $project: {
                                emotions: {
                                    $filter: {
                                        input: "$emotions",
                                        cond: { $eq: ["$$this.emotion", emotion] },
                                    },
                                },
                            },
                        },
                    ])
                    .toArray()
            )[0]?.emotions as Emotion[];

            if (!emotions?.length) return res.send([]);

            const users = await usersCl
                .find({
                    id: { $in: emotions.map((x) => x.user) },
                })
                .project({
                    _id: 0,
                    id: 1,
                    name: 1,
                    sex: 1,
                    role: 1,
                })
                .toArray();

            res.send(users);
        }
    );
    done();
}
