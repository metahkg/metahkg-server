import { ObjectId } from "mongodb";
import { publicUserType } from "./thread";

export type Poll = {
    _id?: ObjectId;
    id: string;
    user: publicUserType;
    createdAt: Date;
    lastModified: Date;
    endsAt?: Date;
    title: string;
    options: { title: string; votes: number }[];
    votes?: {
        user: publicUserType;
        option: number;
        date: Date;
    }[];
};
