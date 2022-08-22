import { ObjectId } from "mongodb";

export default interface Category {
    id: number;
    name: string;
    hidden?: boolean;
    tags?: string[];
    _id?: ObjectId;
}
