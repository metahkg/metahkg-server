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
import { removedCl, threadCl } from "../../../../lib/common";

import regex from "../../../../lib/regex";
import RequireAdmin from "../../../../plugins/requireAdmin";
import { ReasonSchemaAdmin } from "../../../../lib/schemas";
import Thread from "../../../../models/thread";
import { objectFilter } from "../../../../lib/objectFilter";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    const paramsSchema = Type.Object({
        id: Type.RegExp(regex.integer),
    });

    const schema = Type.Object(
        {
            reason: ReasonSchemaAdmin,
        },
        { additionalProperties: false },
    );

    fastify.delete(
        "/",
        { schema: { params: paramsSchema, body: schema }, preParsing: [RequireAdmin] },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res,
        ) => {
            const id = Number(req.params.id);
            const { reason } = req.body;
            const admin = objectFilter(req.user, (key: string) =>
                ["id", "name", "sex", "role"].includes(key),
            );

            const thread = (await threadCl.findOne(
                { id },
                { projection: { _id: 0 } },
            )) as Thread;
            if (!thread)
                return res.code(404).send({ statusCode: 404, error: "Thread not found" });

            await removedCl.insertOne({ thread, type: "thread", admin, reason });

            await threadCl.replaceOne({ id }, { id, removed: true });

            return res.code(204).send();
        },
    );
    done();
}
