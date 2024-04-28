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

import { usersCl } from "../common";
import { sha256 } from "../sha256";

export async function revokeAllSessions(userId: number): Promise<null | true> {
    if (
        !(
            await usersCl.updateOne(
                { id: userId },
                {
                    $set: {
                        sessions: [],
                    },
                },
            )
        ).matchedCount
    ) {
        return null;
    }
    return true;
}

export async function revokeAllSessionsExceptId(
    userId: number,
    sessionId: string,
): Promise<null | true> {
    if (
        !(
            await usersCl.updateOne(
                { id: userId },
                {
                    $pullAll: {
                        sessions: {
                            id: { $ne: sessionId },
                        } as never,
                    },
                },
            )
        ).matchedCount
    ) {
        return null;
    }
    return true;
}

export async function revokeAllSessionsExceptToken(
    userId: number,
    token: string,
): Promise<null | true> {
    if (
        !(
            await usersCl.updateOne(
                { id: userId },
                {
                    $pullAll: {
                        sessions: {
                            token: { $ne: sha256(token) },
                        } as never,
                    },
                },
            )
        ).matchedCount
    ) {
        return null;
    }
    return true;
}
