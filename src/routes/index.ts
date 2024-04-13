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

import users from "./users";
import thread from "./threads";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import me from "./me";
import categories from "./categories";
import auth from "./auth";
import server from "./server";
import games from "./games";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.register(auth, { prefix: "/auth" });
    fastify.register(users, { prefix: "/users" });
    fastify.register(me, { prefix: "/me" });
    fastify.register(categories, { prefix: "/categories" });
    fastify.register(thread, { prefix: "/threads" });
    fastify.register(server, { prefix: "/server" });
    fastify.register(games, { prefix: "/games" });
    done();
};
