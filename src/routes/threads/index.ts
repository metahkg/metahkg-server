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

import { FastifyInstance, FastifyPluginOptions } from "fastify";
import create from "./create";
import threads from "./threads";
import search from "./search";
import thread from "./thread";
import { config } from "../../lib/config";
import RequireAuth from "../../plugins/requireAuth";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    if (config.VISIBILITY === "internal") {
        fastify.addHook("preParsing", RequireAuth);
    }
    fastify.register(threads);
    fastify.register(search);
    fastify.register(create);
    fastify.register(thread, { prefix: "/:id" });
    done();
};
