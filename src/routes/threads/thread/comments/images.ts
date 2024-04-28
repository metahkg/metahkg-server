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

import isInteger from "is-sn-integer";
import { threadCl } from "../../../../lib/common";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import regex from "../../../../lib/regex";
import Thread from "../../../../models/thread";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void,
) => {
    const paramsSchema = Type.Object({
        id: Type.RegExp(regex.integer),
        cid: Type.RegExp(regex.integer),
    });

    fastify.get(
        "/:cid/images",
        { schema: { params: paramsSchema } },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
            }>,
            res,
        ) => {
            if (!isInteger(req.params.id))
                return res.code(400).send({ statusCode: 400, error: "Bad request" });

            const threadId = Number(req.params.id);
            const commentId = Number(req.params.cid);

            const result = (await threadCl.findOne(
                { id: threadId, conversation: { $elemMatch: { id: commentId } } },
                {
                    projection: {
                        _id: 0,
                        conversation: { $elemMatch: { id: commentId } },
                    },
                },
            )) as Thread;

            if (!result)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Thread or comment not found" });

            if (!("removed" in result) && !("removed" in result?.conversation?.[0]))
                res.send(result?.conversation?.[0]?.images);
        },
    );
    done();
};
