import { ObjectId } from "mongodb";
import type { userSex, userRole } from "../types/user";

export default interface Thread {
    id: number;
    title: string;
    op: threadOpType;
    category: number;
    c: number;
    conversation: commentType[];
    score: number;
    lastModified: Date;
    createdAt: Date;
    slink: string;
    images: { src: string; cid: number }[];
    pin?: commentType;
    _id?: ObjectId;
}

export type publicUserType = {
    id: number;
    name: string;
    role: userRole;
    sex: userSex;
};

export type commentType = {
    /** comment id */
    id: number;
    /** if removed all below attributes doesn't exist!!! */
    removed?: true;
    /** user id */
    user: publicUserType;
    /** html string */
    comment: string;
    /** comment converted to text */
    text: string;
    /** date string */
    createdAt: Date;
    /** shortened link */
    slink: string;
    images: string[];
    /** upvotes */
    U?: number;
    /** downvotes */
    D?: number;
    /** replies */
    replies?: number[];
    /** quote **/
    quote?: commentType;
    emotions?: Emotion[];
};

export interface Emotion {
    user: number;
    emotion: string /* must be emoji */;
}

export type threadOpType = {
    id: number;
    name: string;
    sex: userSex;
    role: userRole;
};

export type threadType = Thread;
