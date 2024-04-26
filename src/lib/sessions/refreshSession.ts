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

import { JWT } from "@fastify/jwt";
import { randomBytes } from "crypto";
import { userRole, userSex } from "../../models/user";
import { jwtTokenType } from "../../types/jwt";
import { createToken } from "../auth/createToken";
import { usersCl } from "../common";
import { sha256 } from "../sha256";

export async function refreshSession(
    fastifyJWT: JWT,
    user: {
        id: number;
        name: string;
        sex: userSex;
        role: userRole;
    },
    sessionId: string
) {
    const token = createToken(fastifyJWT, user);
    const refreshToken = randomBytes(30).toString("hex");

    const exp = new Date((fastifyJWT.decode(token) as jwtTokenType).exp * 1000);

    if (
        !(
            await usersCl.updateOne(
                { id: user.id, sessions: { $elemMatch: { id: sessionId } } },
                {
                    $set: {
                        "sessions.$.token": sha256(token),
                        "sessions.$.refreshToken": sha256(refreshToken),
                        "sessions.$.exp": exp,
                    },
                }
            )
        ).modifiedCount
    )
        return null;

    return { token, refreshToken };
}
