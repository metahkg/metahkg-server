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

import { randomBytes } from "crypto";
import { usersCl } from "../common";
import { sha256 } from "../sha256";
import { createDecoder } from "fast-jwt";
import { jwtTokenType } from "../../types/jwt";
import User, { Session } from "../../models/user";

export async function createSession(
    userId: number,
    token: string,
    userAgent: string,
    ip: string,
    sameIp?: boolean,
    createdAt: Date = new Date()
): Promise<
    Session & {
        /** jwt token (unhashed) */
        token: string;
        /** refresh token (unhashed) */
        refreshToken: string;
    }
> {
    const decode = createDecoder();
    const exp = (decode(token) as jwtTokenType)?.exp * 1000;
    if (!exp) return null;

    const refreshToken = randomBytes(30).toString("hex");

    const session: Session = {
        id: randomBytes(30).toString("hex"),
        token: sha256(token),
        refreshToken: sha256(refreshToken),
        createdAt,
        exp: new Date(exp),
        userAgent,
        ip: sha256(ip),
        ...(sameIp && { sameIp }),
    };

    while (
        (await usersCl.findOne({
            sessions: {
                $elemMatch: { id: session.id },
            },
        })) as User
    ) {
        session.id = randomBytes(30).toString("hex");
    }

    if (
        !(
            await usersCl.updateOne(
                { id: userId },
                {
                    $push: {
                        sessions: session,
                    },
                }
            )
        ).modifiedCount
    )
        return null;

    return { ...session, token, refreshToken };
}
