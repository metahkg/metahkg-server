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

import { ObjectId } from "mongodb";
import { AdminUser } from "./thread";

export type userSex = "M" | "F";
export type userRole = "admin" | "user";

export interface BlockedUser {
    id: number;
    date: Date;
    reason: string;
}

export interface FollowedUser {
    id: number;
    date: Date;
}

export interface Subscription {
    endpoint: string;
    keys: {
        auth: string;
        p256dh: string;
    };
}

export interface Notification {
    title: string;
    createdAt: Date;
    options: {
        body: string;
        data: {
            type: "thread" | "comment" | "reply" | "emotion" | "votes";
            threadId: number;
            commentId?: number;
            url: string;
        };
    };
}

export interface Session {
    /** 60-digit random id */
    id: string;
    /** hashed (sha256) jwt token */
    token: string;
    /** hashed (sha256) refresh token (60-digit string) **/
    refreshToken: string;
    createdAt: Date;
    exp: Date;
    userAgent: string;
    /** hashed (sha256) ip */
    ip: string;
    sameIp?: boolean;
    subscription?: Subscription;
}

export interface Votes {
    [id: number]: { cid: number; vote: "U" | "D" }[];
}

export interface UserGames {
    tokens?: number;
}

export default interface User {
    _id?: ObjectId;
    id: number;
    createdAt: Date;
    name: string;
    /** hashed (sha256) email */
    email: string;
    password: string;
    sex: userSex;
    role: userRole;
    starred?: { id: number; date: Date }[];
    sessions?: Session[];
    notifications?: Notification[];
    following?: FollowedUser[];
    blocked?: BlockedUser[];
    mute?: { admin: AdminUser; reason: string; exp?: Date };
    ban?: { admin: AdminUser; reason: string; exp?: Date };
    votes?: Votes;
    games?: UserGames;
}
