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

import { FastifyReply, FastifyRequest } from "fastify";
import { threadCl } from "../lib/common";
import Thread from "../models/thread";

export default async function (
    req: FastifyRequest<{ Params: { id: string; cid: string } }>,
    res: FastifyReply
) {
    const id = Number(req.params.id);
    const cid = Number(req.params.cid);

    if (!id || !cid) return;

    const thread = (await threadCl.findOne(
        {
            id,
            conversation: { $elemMatch: { id: cid } },
        },
        { projection: { _id: 0, conversation: { $elemMatch: { id: cid } } } }
    )) as Thread | null;

    if (!thread)
        return res
            .code(404)
            .send({ statusCode: 404, error: "Thread or comment not found" });

    if ("removed" in thread)
        return res.code(410).send({ statusCode: 410, error: "Thread removed" });

    const comment = thread?.conversation?.[0];

    if ("removed" in comment)
        return res.code(410).send({ statusCode: 410, error: "Comment removed" });

    if (comment.visibility === "internal" && !req.user) {
        return res.code(403).send({ statusCode: 403, error: "Forbidden" });
    }

    return;
}
