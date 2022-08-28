import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { htmlToText } from "html-to-text";
import { ObjectId } from "mongodb";
import { threadCl } from "../../../../common";
import verifyUser from "../../../../lib/auth/verify";
import regex from "../../../../lib/regex";
import checkComment from "../../../../plugins/checkComment";
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

    const schema = Type.Object(
        {
            comment: Type.String(),
            reason: Type.String(),
        },
        { minProperties: 2, additionalProperties: false }
    );

    fastify.put(
        "/:cid",
        { schema: { params: paramsSchema }, preHandler: [requireAdmin, checkComment] },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);

            const user = verifyUser(req.headers.authorization);

            const { comment, reason } = req.body;

            const text = htmlToText(comment);

            const index = (
                (await threadCl.findOne(
                    { id },
                    {
                        projection: {
                            _id: 0,
                            index: { $indexOfArray: ["$conversation.id", cid] },
                        },
                    }
                )) as { _id: ObjectId; index: number }
            )?.index;

            await threadCl.updateOne(
                { id },
                {
                    $set: {
                        [`conversation.${index}.comment`]: comment,
                        [`conversation.${index}.text`]: text,
                    },
                    $push: {
                        [`conversation.${index}.admin.edits`]: {
                            admin: user,
                            reason,
                        },
                    },
                }
            );

            return res.send({ success: true });
        }
    );
    done();
}
