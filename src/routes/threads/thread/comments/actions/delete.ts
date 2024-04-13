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
import { removedCl, threadCl } from "../../../../../lib/common";

import regex from "../../../../../lib/regex";
import Thread from "../../../../../models/thread";
import RequireAdmin from "../../../../../plugins/requireAdmin";
import { ReasonSchemaAdmin } from "../../../../../lib/schemas";
import { objectFilter } from "../../../../../lib/objectFilter";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
        cid: Type.RegEx(regex.integer),
    });

    const schema = Type.Object(
        {
            reason: ReasonSchemaAdmin,
        },
        { additionalProperties: false },
    );

    fastify.delete(
        "/:cid",
        { schema: { params: paramsSchema, body: schema }, preParsing: [RequireAdmin] },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res,
        ) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);
            const { reason } = req.body;
            const admin = objectFilter(req.user, (key: string) =>
                ["id", "name", "sex", "role"].includes(key),
            );

            const thread = (await threadCl.findOne(
                { id, conversation: { $elemMatch: { id: cid } } },
                {
                    projection: {
                        _id: 0,
                        pin: 1,
                        conversation: { $elemMatch: { id: cid } },
                        index: { $indexOfArray: ["$conversation.id", cid] },
                    },
                },
            )) as Thread & { index: number };

            const index = thread?.index;

            // index can be 0
            if (index === undefined || index === -1)
                return res
                    .code(404)
                    .send({ statusCode: 404, error: "Thread or comment not found" });

            if ("removed" in thread) return;

            await removedCl.insertOne({
                comment: thread.conversation[0],
                thread_id: id,
                admin,
                reason,
            });

            await threadCl.updateOne(
                { id },
                {
                    $set: { [`conversation.${index}`]: { id: cid, removed: true } },
                    // remove the pinned comment if is the removed comment
                    ...(thread.pin?.id === cid && { $unset: { pin: 1 } }),
                },
            );

            // remove quotes of the comment
            // first order only
            // TODO: remove higher orders (need to do it recursively)
            await threadCl.updateOne(
                { id },
                { $unset: { "conversation.$[elem].quote": 1 } },
                { arrayFilters: [{ "elem.quote.id": cid }] },
            );

            return res.code(204).send();
        },
    );
    done();
}
