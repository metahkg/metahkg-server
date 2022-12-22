import { ObjectId } from "mongodb";

export interface Link {
    _id?: ObjectId;
    /** 6-digit id */
    id: string;
    /** web app url, absolute, without domain */
    url: string;
}
