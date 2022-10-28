import { ObjectId } from "mongodb";
import { userRole, userSex } from "../types/user";
import { AdminUser } from "./thread";

export interface BlockedUser {
    id: number;
    date: Date;
    reason: string;
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
    sessions?: Session[];
    blocked?: BlockedUser[];
    mute?: { admin: AdminUser; reason: string; exp?: Date };
    ban?: { admin: AdminUser; reason: string; exp?: Date };
}
