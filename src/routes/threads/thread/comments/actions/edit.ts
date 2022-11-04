import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { htmlToText } from "html-to-text";
import { ObjectId } from "mongodb";
import { threadCl } from "../../../../../lib/common";

import regex from "../../../../../lib/regex";
import checkComment from "../../../../../plugins/checkComment";
import RequireAdmin from "../../../../../plugins/requireAdmin";
import { ReasonSchemaAdmin, CommentContentSchema } from "../../../../../lib/schemas";

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
            content: CommentContentSchema,
            reason: ReasonSchemaAdmin,
        },
        { minProperties: 2, additionalProperties: false }
    );

    fastify.patch(
        "/:cid",
        {
            schema: { params: paramsSchema, body: schema },
            preHandler: [RequireAdmin, checkComment],
        },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);

            const user = req.user;

            const { content, reason } = req.body;

            const text = htmlToText(content.html);

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
                        [`conversation.${index}.comment`]: content,
                        [`conversation.${index}.text`]: text,
                    },
                    $push: {
                        [`conversation.${index}.admin.edits`]: {
                            admin: user,
                            reason,
                            date: new Date(),
                        },
                    },
                }
            );

            return res.send({ success: true });
        }
    );
    done();
}
