import { ObjectId } from "mongodb";

export default interface Votes {
    _id?: ObjectId;
    id: number;
    [id: number]: { cid: number; vote: "U" | "D" }[];
}
