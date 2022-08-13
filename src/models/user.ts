import { ObjectId } from "mongodb";
import { userRole, userSex } from "../types/user";

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
}
