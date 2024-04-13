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
import { Subscription } from "../../models/user";
import { sha256 } from "../sha256";

export async function subscribeById(
    userId: number,
    sessionId: string,
    subscription: Subscription
) {
    if (
        !(
            await usersCl.updateOne(
                { id: userId, sessions: { $elemMatch: { id: sessionId } } },
                { $set: { "sessions.$.subscription": subscription } }
            )
        ).matchedCount
    ) {
        return null;
    }

    return true;
}

export async function subscribeByToken(
    userId: number,
    token: string,
    subscription: Subscription
) {
    const hashedToken = sha256(token);
    if (
        !(
            await usersCl.updateOne(
                { id: userId, sessions: { $elemMatch: { token: hashedToken } } },
                { $set: { "sessions.$.subscription": subscription } }
            )
        ).matchedCount
    ) {
        return null;
    }

    return true;
}
