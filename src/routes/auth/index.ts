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
import register from "./register";
import login from "./login";
import verify from "./verify";
import resend from "./resend";
import reset from "./reset";
import forgot from "./forgot";
import sessions from "./sessions";
import logout from "./logout";
import session from "./session";

export default (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (e?: Error) => void,
) => {
    fastify.register(sessions, { prefix: "/sessions" });
    fastify.register(session);
    fastify.register(login);
    fastify.register(logout);
    fastify.register(register);
    fastify.register(verify);
    fastify.register(resend);
    fastify.register(reset);
    fastify.register(forgot);
    done();
};
