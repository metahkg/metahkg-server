import { ObjectId } from "mongodb";

export interface System {
    _id?: ObjectId,
    lastUserId?: number;
    lastThreadId?: number
}
