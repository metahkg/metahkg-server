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
import Thread from "../../../models/thread";

import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../lib/regex";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    fastify.delete(
        "/pin",
        { schema: { params: paramsSchema } },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
            }>,
            res
        ) => {
            const threadId = Number(req.params.id);

            const user = req.user;

            const thread = (await threadCl.findOne(
                { id: threadId },
                { projection: { _id: 0, op: 1, pin: 1 } }
            )) as Thread;

            if (!thread)
                return res.code(404).send({ statusCode: 404, error: "Thread not found" });
            if ("removed" in thread) return;

            const authorized = user && thread?.op?.id === user.id;
            if (!authorized)
                return res.code(403).send({ statusCode: 403, error: "Forbidden" });

            if (!thread.pin)
                return res
                    .code(409)
                    .send({ statusCode: 409, error: "No comment is pinned" });

            await threadCl.updateOne({ id: threadId }, { $unset: { pin: 1 } });

            return res.code(204).send();
        }
    );
    done();
};
