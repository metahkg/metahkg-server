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

import Thread from "../../models/thread";
import { threadCl } from "../../lib/common";
import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { hiddencats } from "../../lib/hiddencats";

import regex from "../../lib/regex";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const querySchema = Type.Object(
        {
            id: Type.Optional(
                Type.Union([
                    Type.Array(Type.RegEx(regex.integer), { maxItems: 50 }),
                    Type.RegEx(regex.integer),
                ])
            ),
        },
        { additionalProperties: false }
    );

    fastify.get(
        "/",
        { schema: { querystring: querySchema } },
        async (req: FastifyRequest<{ Querystring: Static<typeof querySchema> }>, res) => {
            if (!req.query.id) return res.send([]);

            const threads = [req.query.id].flat(Infinity).map((id) => Number(id));
            const user = req.user;

            const result = (await threadCl
                .find({
                    id: { $in: threads },
                    ...(!user && { category: { $nin: await hiddencats() } }),
                    removed: { $ne: true },
                })
                .project({ _id: 0, conversation: 0, images: 0, pin: 0 })
                .toArray()) as Thread[];

            res.send(
                threads.map((tid) => result.find((i) => i.id === tid)).filter((i) => i)
            );
        }
    );
    done();
};
