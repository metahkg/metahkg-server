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

import Thread from "../../../../models/thread";
import { threadCl } from "../../../../lib/common";
import { Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../../lib/regex";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
        cid: Type.RegEx(regex.integer),
    });

    fastify.get(
        "/:cid",
        { schema: paramsSchema },
        async (req: FastifyRequest<{ Params: { id: string; cid: string } }>, res) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);

            const thread = (await threadCl.findOne(
                { id, conversation: { $elemMatch: { id: cid } } },
                {
                    projection: {
                        _id: 0,
                        conversation: {
                            $elemMatch: {
                                id: cid,
                            },
                        },
                    },
                }
            )) as Thread | null;

            if (!thread)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Thread or comment not found" });

            if ("removed" in thread) return;

            const comment = thread?.conversation?.[0];

            res.send(comment);
        }
    );
    done();
};
