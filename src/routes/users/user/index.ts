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
import avatar from "./avatar";
import threads from "./threads";
import name from "./name";
import profile from "./profile";
import block from "./actions/block";
import unblock from "./actions/unblock";
import mute from "./actions/mute";
import unmute from "./actions/unmute";
import edit from "./actions/edit";
import ban from "./actions/ban";
import unban from "./actions/unban";
import follow from "./actions/follow";
import unfollow from "./actions/unfollow";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.register(avatar, { prefix: "/avatar" });
    fastify.register(profile);
    fastify.register(name);
    fastify.register(threads);
    fastify.register(block);
    fastify.register(unblock);
    fastify.register(follow);
    fastify.register(unfollow);
    fastify.register(mute);
    fastify.register(unmute);
    fastify.register(ban);
    fastify.register(unban);
    fastify.register(edit);
    done();
}
