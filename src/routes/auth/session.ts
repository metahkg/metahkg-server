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

import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { getSessionByToken } from "../../lib/sessions/getSession";
import { objectFilter } from "../../lib/objectFilter";
import requireAuth from "../../plugins/requireAuth";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.get("/session", { preParsing: [requireAuth] }, async (req, res) => {
        const user = req.user;

        const session = await getSessionByToken(
            user.id,
            req.headers.authorization?.slice(7)
        );

        res.send(
            objectFilter(session, (key) =>
                ["id", "createdAt", "exp", "sameIp", "userAgent"].includes(key)
            )
        );
    });
    done();
};
