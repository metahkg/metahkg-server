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

import { FastifyReply, FastifyRequest } from "fastify";
import { threadCl } from "../lib/common";
import Thread from "../models/thread";

export default async function (
    req: FastifyRequest<{ Params: { id: string } }>,
    res: FastifyReply
) {
    const id = Number(req.params.id);

    if (!id) return;

    const thread = (await threadCl.findOne(
        { id },
        { projection: { _id: 0, id: 1, removed: 1 } }
    )) as Thread;

    if (!thread)
        return res.code(404).send({ statusCode: 404, error: "Thread not found" });

    if ("removed" in thread)
        return res.code(410).send({ statusCode: 410, error: "Thread removed" });

    return;
}
