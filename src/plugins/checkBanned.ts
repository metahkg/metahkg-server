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

import { FastifyReply, FastifyRequest } from "fastify";
import { usersCl } from "../lib/common";
import { formatDate } from "../lib/formatDate";
import User from "../models/user";

export default async function checkBanned(req: FastifyRequest, res: FastifyReply) {
    const user = req.user;
    if (!user) return;

    const ban = (
        (await usersCl.findOne(
            { id: user.id, ban: { $exists: true } },
            { projection: { _id: 0, ban: 1 } }
        )) as User
    )?.ban;

    if (ban)
        return res.code(403).send({
            statusCode: 403,
            error: "Forbidden",
            message: `You have been banned${
                ban.exp ? ` until ${formatDate(ban.exp)}` : ""
            }: ${ban.reason || "No reason provided."}`,
            ...(ban.exp && { exp: ban.exp }),
        });

    return;
}
