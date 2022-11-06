/*
 Copyright (C) 2022-present Metahkg Contributors

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { domain, threadCl } from "../../../../../lib/common";

import { sendNotification } from "../../../../../lib/notifications/sendNotification";
import regex from "../../../../../lib/regex";
import Thread from "../../../../../models/thread";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
        cid: Type.RegEx(regex.integer),
    });

    const schema = Type.Object(
        {
            emotion: Type.RegEx(regex.emoji),
        },
        { additionalProperties: false }
    );

    fastify.post(
        "/",
        { schema: { params: paramsSchema, body: schema } },
        async function (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) {
            const user = req.user;
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

            const id = Number(req.params.id);
            const cid = Number(req.params.cid);

            const { emotion } = req.body;

            const thread = (await threadCl.findOne(
                {
                    id,
                    conversation: { $elemMatch: { id: cid } },
                },
                {
                    projection: {
                        _id: 0,
                        id: 1,
                        title: 1,
                        index: {
                            $indexOfArray: ["$conversation.id", cid],
                        },
                        conversation: { $elemMatch: { id: cid } },
                    },
                }
            )) as Thread & { index: number };

            const index = thread?.index;

            // index can be 0
            if (index === undefined || index === -1)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Comment not found." });

            // remove previous value first
            await threadCl.updateOne(
                { id },
                {
                    $pull: {
                        [`conversation.${index}.emotions`]: {
                            user: user.id,
                        },
                    },
                }
            );

            await threadCl.updateOne(
                { id },
                {
                    $push: {
                        [`conversation.${index}.emotions`]: {
                            user: user.id,
                            emotion,
                        },
                    },
                }
            );

            if (
                !("removed" in thread) &&
                !("removed" in thread.conversation?.[0]) &&
                thread.conversation[0]?.user?.id !== user.id
            )
                sendNotification(thread?.conversation[0].user.id, {
                    title: `New reaction (${thread.title})`,
                    createdAt: new Date(),
                    options: {
                        body: `${user.name} (#${user.id}): ${emotion}`,
                        data: {
                            type: "emotion",
                            threadId: thread.id,
                            commentId: thread.conversation[0].id,
                            url: `https://${domain}/thread/${thread.id}?c=${thread.conversation[0].id}`,
                        },
                    },
                });

            return res.send({ success: true });
        }
    );

    done();
}
