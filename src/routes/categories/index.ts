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
import category from "./category";
import threads from "./threads";
import create from "./create";
import edit from "./actions/edit";
import deleteCategory from "./actions/delete";
import categories from "./categories";
import { config } from "../../lib/config";
import RequireAuth from "../../plugins/requireAuth";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    if (config.VISIBILITY === "internal") {
        fastify.addHook("preParsing", RequireAuth);
    }
    fastify.register(categories);
    fastify.register(category);
    fastify.register(threads);
    fastify.register(create);
    fastify.register(edit);
    fastify.register(deleteCategory);
    done();
}
