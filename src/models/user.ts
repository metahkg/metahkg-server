import { ObjectId } from "mongodb";
import { userRole, userSex } from "../types/user";
import { AdminUser } from "./thread";

export interface BlockedUser {
    id: number;
    date: Date;
    reason: string;
}

export default interface User {
    _id?: ObjectId;
    id: number;
    createdAt: Date;
    name: string;
    email: string;
    pwd: string;
    sex: userSex;
    role: userRole;
    blocked?: BlockedUser[];
    mute?: { admin: AdminUser; reason: string; exp?: Date };
    ban?: { admin: AdminUser; reason: string; exp?: Date };
}
