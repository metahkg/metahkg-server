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

import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { usersCl } from "../../../lib/common";

import User from "../../../models/user";
import RequireAuth from "../../../plugins/requireAuth";

export default function sessions(
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.get("/", { preParsing: [RequireAuth] }, async (req: FastifyRequest, res) => {
        const user = req.user;

        const sessions = (
            (await usersCl.findOne(
                { id: user.id },
                {
                    projection: {
                        _id: 0,
                        sessions: {
                            id: 1,
                            createdAt: 1,
                            exp: 1,
                            sameIp: 1,
                            userAgent: 1,
                        },
                    },
                }
            )) as User
        )?.sessions;

        return res.send(sessions);
    });
    done();
}
