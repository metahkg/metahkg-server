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

import { usersCl } from "../lib/common";
import User from "../models/user";
import { createToken } from "../lib/auth/createToken";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { updateSessionByToken } from "../lib/sessions/updateSession";

export default async function (
    this: FastifyInstance,
    req: FastifyRequest,
    res: FastifyReply
) {
    const user = req.user;

    if (user) {
        const userData = (await usersCl.findOne(
            { id: user.id },
            { projection: { _id: 0, id: 1, name: 1, sex: 1 } }
        )) as User;
        if (userData.name !== user.name || userData.sex !== user.sex) {
            const newToken = createToken(this.jwt, user);

            await updateSessionByToken(
                user.id,
                req.headers.authorization?.slice(7),
                newToken
            );

            req.headers.authorization = `Bearer ${newToken}`;
            res.header("token", newToken);
        }
    }
}
