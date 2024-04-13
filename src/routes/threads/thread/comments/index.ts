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

import comment from "./comment";
import replies from "./replies";
import create from "./create";
import vote from "./vote";
import images from "./images";
import emotion from "./emotion";
import emotions from "./emotions";
import votes from "./votes";
import deleteComment from "./actions/delete";
import edit from "./actions/edit";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import checkComment from "../../../../plugins/checkComment";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void,
) {
    fastify.register(create);
    fastify.addHook("preHandler", checkComment);
    fastify.register(comment);
    fastify.register(replies);
    fastify.register(vote);
    fastify.register(images);
    fastify.register(emotions);
    fastify.register(votes);
    fastify.register(deleteComment);
    fastify.register(edit);
    fastify.register(emotion, { prefix: "/:cid/emotion" });
    done();
}
