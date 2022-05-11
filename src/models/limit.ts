import { limitType } from "db/limit";
import { ObjectId } from "mongodb";

export default class Limit {
    constructor(
        public type: limitType,
        public id?: number,
        public email?: string,
        public _id?: ObjectId,
    ) {}
}
