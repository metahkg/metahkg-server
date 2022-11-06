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
import { usersCl } from "../../lib/common";
import User, { FollowedUser } from "../../models/user";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    fastify.get("/following", async (req, res) => {
        const user = req.user;
        if (!user) return res.code(401).send({ statusCode: 401, error: "Unauthorized." });

        const following = ((
            await usersCl.findOne(
                { id: user.id },
                { projection: { _id: 0, following: 1 } }
            )
        )?.following || []) as FollowedUser[];

        const usersFollowed = (await usersCl
            .find(
                { id: { $in: following.map((b) => b.id) } },
                { projection: { _id: 0, id: 1, name: 1, sex: 1, role: 1 } }
            )
            .toArray()) as User[];

        res.send(
            following
                .map((f) => ({ ...f, ...usersFollowed.find((u) => u.id === f.id) }))
                .filter((i) => i.name && i.id)
        );
    });
    done();
}
