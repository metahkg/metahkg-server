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
import { threadCl } from "../../../../../lib/common";

import regex from "../../../../../lib/regex";
import Thread from "../../../../../models/thread";

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
        "/",
        {
            schema: {
                params: paramsSchema,
            },
        },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);
            const user = req.user;

            if (!user)
                return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

            const thread = (await threadCl.findOne(
                {
                    id,
                    conversation: { $elemMatch: { id: cid } },
                },
                {
                    projection: {
                        _id: 0,
                        index: {
                            $indexOfArray: ["$conversation.id", cid],
                        },
                    },
                }
            )) as Thread & { index: number };

            const index = thread?.index;

            // index can be 0
            if (index === undefined || index === -1)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Comment not found." });

            if (
                !(
                    await threadCl.updateOne(
                        {
                            id,
                            [`conversation.${index}.emotions`]: {
                                $elemMatch: { user: user.id },
                            },
                        },
                        {
                            $pull: {
                                [`conversation.${index}.emotions`]: { user: user.id },
                            },
                        }
                    )
                ).matchedCount
            )
                return res
                    .code(409)
                    .send({ statusCode: 409, error: "Emotion doesn't exist." });

            return res.code(204).send();
        }
    );
    done();
}
