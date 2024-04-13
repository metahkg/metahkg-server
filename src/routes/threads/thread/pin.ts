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
import { threadCl } from "../../../lib/common";

import Thread, { Comment } from "../../../models/thread";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../lib/regex";
import { IntegerSchema } from "../../../lib/schemas";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    const schema = Type.Object(
        {
            cid: IntegerSchema,
        },
        { additionalProperties: false }
    );

    fastify.put(
        "/pin",
        {
            schema: {
                params: paramsSchema,
                body: schema,
            },
        },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) => {
            const threadId = Number(req.params.id);
            const { cid: commentId } = req.body;

            const user = req.user;
            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized" });

            const thread = (await threadCl.findOne(
                {
                    id: threadId,
                    conversation: {
                        $elemMatch: {
                            id: commentId,
                        },
                    },
                },
                {
                    projection: {
                        _id: 0,
                        op: 1,
                        conversation: {
                            $elemMatch: {
                                id: commentId,
                            },
                        },
                        visibility: 1,
                    },
                }
            )) as Thread & { removed: undefined };

            if (!thread)
                return res.code(404).send({ statusCode: 404, error: "Thread not found" });

            if (thread?.op?.id !== user.id)
                return res.code(403).send({ statusCode: 403, error: "Forbidden" });

            const comment = Object.fromEntries(
                Object.entries(thread.conversation?.[0]).filter(
                    (i) => !["replies", "U", "D", "admin"].includes(i[0])
                )
            ) as Comment;

            if (!comment)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Comment not found" });

            if ("removed" in comment) {
                return res.code(410).send({
                    statusCode: 410,
                    error: "Comment removed",
                });
            }

            if (comment.visibility === "internal" && thread.visibility !== "internal") {
                return res.code(403).send({
                    statusCode: 403,
                    error: "Forbidden",
                    message:
                        "Pinning an internal comment in a public thread is not allowed.",
                });
            }

            await threadCl.updateOne({ id: threadId }, { $set: { pin: comment } });

            res.code(204).send();
        }
    );
    done();
}
