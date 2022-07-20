import { ObjectId } from "mongodb";

export type limitType = "resend" | "reset" | "create";

export default class Limit {
    constructor(
        public type: limitType,
        public id?: number,
        public email?: string,
        public _id?: ObjectId
    ) {}
}
