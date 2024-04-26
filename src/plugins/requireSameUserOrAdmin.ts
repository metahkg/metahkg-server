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

import { FastifyRequest, FastifyReply } from "fastify";

export default async function RequireSameUserOrAdmin(
    req: FastifyRequest<{ Params: { id: string } }>,
    res: FastifyReply,
) {
    const userId = Number(req.params.id);
    const user = req.user;

    if (!user) return res.code(401).send({ statusCode: 401, error: "Unauthorized" });
    if (user.id !== userId && user.role !== "admin")
        return res.code(403).send({ statusCode: 403, error: "Forbidden" });

    return;
}
