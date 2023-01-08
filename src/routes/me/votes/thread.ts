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

import { votesCl } from "../../../lib/common";

import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import regex from "../../../lib/regex";
import Votes from "../../../models/votes";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
    });

    fastify.get(
        "/threads/:id",
        {
            schema: {
                params: paramsSchema,
            },
        },
        async (req: FastifyRequest<{ Params: Static<typeof paramsSchema> }>, res) => {
            const threadId = Number(req.params.id);

            const user = req.user;

            const votes = (await votesCl.findOne(
                { id: user.id },
                { projection: { [threadId]: 1, _id: 0 } }
            )) as Votes;

            res.send(votes?.[threadId] || []);
        }
    );
    done();
};
