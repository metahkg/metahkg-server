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
import images from "./images";
import thread from "./thread";
import comments from "./comments";
import category from "./category";
import deleteThread from "./actions/delete";
import star from "./actions/star";
import unstar from "./actions/unstar";
import checkHidden from "../../../plugins/checkHidden";
import edit from "./actions/edit";
import checkThread from "../../../plugins/checkThread";
import pin from "./pin";
import unpin from "./unpin";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void
) => {
    fastify.addHook("preHandler", checkHidden);
    fastify.addHook("preHandler", checkThread);
    fastify.register(comments, { prefix: "/comments" });
    fastify.register(thread);
    fastify.register(images);
    fastify.register(category);
    fastify.register(star);
    fastify.register(unstar);
    fastify.register(deleteThread);
    fastify.register(edit);
    fastify.register(pin);
    fastify.register(unpin);
    done();
};
