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

import blocked from "./blocked";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import votes from "./votes";
import starred from "./starred";
import notifications from "./notifications";
import following from "./following";
import RequireAuth from "../../plugins/requireAuth";
import games from "./games";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void,
) {
    fastify.addHook("preParsing", RequireAuth);
    fastify.register(votes, { prefix: "/votes" });
    fastify.register(games, { prefix: "/games" });
    fastify.register(blocked);
    fastify.register(starred);
    fastify.register(following);
    fastify.register(notifications, { prefix: "/notifications" });
    done();
}
