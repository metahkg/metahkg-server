import { ObjectId } from "mongodb";

export interface Invite {
    _id?: ObjectId;
    description?: string;
    // 10-digit code
    code: string;
    createdAt: Date;
}
