import { ObjectId } from "mongodb";
import type { userSex, userRole } from "../types/user";

export default class Thread {
    constructor(
        public id: number,
        public title: string,
        public op: threadOpType,
        public category: number,
        public c: number,
        public conversation: commentType[],
        public score: number,
        public lastModified: Date,
        public createdAt: Date,
        public slink: string,
        public images: { src: string; cid: number }[],
        public pin?: commentType,
        public _id?: ObjectId
    ) {}
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
    images: string[],
    /** upvotes */
    U?: number;
    /** downvotes */
    D?: number;
    /** replies */
    replies?: number[];
    /** quote **/
    quote?: commentType;
};

export type threadOpType = {
    id: number;
    name: string;
    sex: userSex;
    role: userRole;
};

export type threadType = Thread;
