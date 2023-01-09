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
import User, { Session } from "../../models/user";
import { sha256 } from "../sha256";

export function getSessionByToken(
    userId: number,
    sessionId: string,
    includeUser: true
): Promise<
    | (Session & {
          user: User;
      })
    | null
>;
export function getSessionByToken(
    userId: number,
    sessionId: string,
    includeUser: false
): Promise<Session | null>;
export function getSessionByToken(
    userId: number,
    sessionId: string
): Promise<Session | null>;

export async function getSessionByToken(
    userId: number,
    token: string,
    includeUser?: boolean
) {
    const hashedToken = sha256(token);
    const user = (await usersCl.findOne({
        id: userId,
        "sessions.token": hashedToken,
    })) as User;

    // not using project since cannot retrieve the whole user object (would only include the sessions field)
    const session = user?.sessions.find((session) => session.token === hashedToken);

    return includeUser
        ? {
              ...session,
              user,
          }
        : session;
}

export function getSessionById(
    userId: number,
    sessionId: string,
    includeUser: true
): Promise<
    | (Session & {
          user: User;
      })
    | null
>;
export function getSessionById(
    userId: number,
    sessionId: string,
    includeUser: false
): Promise<Session | null>;
export function getSessionById(
    userId: number,
    sessionId: string
): Promise<Session | null>;

export async function getSessionById(
    userId: number,
    sessionId: string,
    includeUser?: boolean
) {
    const user = (await usersCl.findOne({
        id: userId,
        "sessions.id": { id: sessionId },
    })) as User;

    if (!user) return null;

    // not using project since cannot retrieve the whole user object (would only include the sessions field)
    const session = user?.sessions.find((session) => session.id === sessionId);

    return includeUser
        ? {
              ...session,
              user,
          }
        : session;
}

export function getSessionByIdOnly(
    sessionId: string,
    includeUser: true
): Promise<
    | (Session & {
          user: User;
      })
    | null
>;
export function getSessionByIdOnly(
    sessionId: string,
    includeUser: false
): Promise<Session | null>;
export function getSessionByIdOnly(sessionId: string): Promise<Session | null>;

export async function getSessionByIdOnly(sessionId: string, includeUser?: boolean) {
    const user = (await usersCl.findOne({
        "sessions.id": { id: sessionId },
    })) as User;

    if (!user) return null;

    // not using project since cannot retrieve the whole user object (would only include the sessions field)
    const session = user?.sessions.find((session) => session.id === sessionId);

    return includeUser
        ? {
              ...session,
              user,
          }
        : session;
}
