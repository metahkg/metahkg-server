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
    /** 30-digit random id */
    id: string;
    /** hashed (sha256) jwt token */
    token: string;
    createdAt: Date;
    exp: Date;
    userAgent: string;
    /** hashed (sha256) ip */
    ip: string;
    sameIp?: boolean;
    subscription?: Subscription;
}

export default interface User {
    _id?: ObjectId;
    id: number;
    createdAt: Date;
    name: string;
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
}
