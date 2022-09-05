import { ObjectId } from "mongodb";

export type limitType = "resend" | "reset" | "create";

export default interface Limit {
    type: limitType;
    id?: number;
    email?: string;
    _id?: ObjectId;
}
