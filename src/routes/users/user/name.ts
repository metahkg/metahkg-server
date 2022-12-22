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

import User from "../../../models/user";
import { usersCl } from "../../../lib/common";
import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import regex from "../../../lib/regex";

/** get username */
export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) {
    const paramsSchema = Type.Object({ id: Type.RegEx(regex.integer) });

    fastify.get(
        "/name",
        {
            schema: {
                params: paramsSchema,
            },
        },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);

            const requestedUser = (await usersCl.findOne(
                { id },
                { projection: { name: 1, _id: 0 } }
            )) as User;

            if (!requestedUser)
                return res.code(404).send({ statusCode: 404, error: "User not found" });

            res.send(requestedUser);
        }
    );
    done();
}
