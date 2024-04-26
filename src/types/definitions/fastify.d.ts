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

import "fastify";
import "@fastify/jwt";
import { jwtTokenType } from "../jwt";

declare module "@fastify/jwt" {
    interface FastifyJWT {
        user: null | jwtTokenType;
    }
}

declare module "fastify" {
    export interface FastifyInstance {
        authenticate: (req: FastifyRequest, res: FastifyReply) => void;
    }
    export interface FastifyRequest {
        user: null | jwtTokenType;
    }
}
