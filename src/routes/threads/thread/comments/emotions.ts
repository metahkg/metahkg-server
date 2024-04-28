/*
 Copyright (C) 2022-present Wong Chun Yat (wcyat)

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
import { threadCl } from "../../../../lib/common";
import regex from "../../../../lib/regex";
import Thread from "../../../../models/thread";

export default function emotions(
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void,
) {
    const paramsSchema = Type.Object({
        id: Type.RegExp(regex.integer),
        cid: Type.RegExp(regex.integer),
    });

    fastify.get(
        "/:cid/emotions",
        { schema: { params: paramsSchema } },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);

            const thread = (await threadCl.findOne(
                {
                    id,
                    conversation: { $elemMatch: { id: cid } },
                },
                {
                    projection: {
                        _id: 1,
                        conversation: { $elemMatch: { id: cid } },
                    },
                },
            )) as Thread;

            if (!thread)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Thread or comment not found" });

            if ("removed" in thread) return;

            const comment = thread?.conversation?.[0];

            if (!("removed" in comment)) res.send(comment?.emotions || []);
        },
    );
    done();
}
