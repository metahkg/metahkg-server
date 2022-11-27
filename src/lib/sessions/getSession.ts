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

import { usersCl } from "../common";
import User from "../../models/user";
import { sha256 } from "../sha256";

export async function getSessionByToken(userId: number, token: string) {
    const hashedToken = sha256(token);
    const user = (await usersCl.findOne(
        {
            id: userId,
            sessions: { $elemMatch: { token: hashedToken } },
        },
        { projection: { sessions: { $elemMatch: { token: hashedToken } } } }
    )) as User;

    if (!user) return null;

    return user?.sessions[0];
}

export async function getSessionById(userId: number, sessionId: string) {
    const user = (await usersCl.findOne(
        {
            id: userId,
            sessions: { $elemMatch: { id: sessionId } },
        },
        { projection: { sessions: { $elemMatch: { id: sessionId } } } }
    )) as User;

    if (!user) return null;

    return user?.sessions[0];
}
