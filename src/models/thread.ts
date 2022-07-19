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
        public vote: number,
        public lastModified: Date,
        public createdAt: Date,
        public slink: string,
        public images: { image: string; cid: number }[],
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

export interface threadType {
    /** mongodb object id */
    _id: string;
    /** thread id */
    id: number;
    /** original poster */
    op: threadOpType;
    /** number of comments */
    c: number;
    /** conversation */
    conversation: commentType[];
    /** upvote - downvote  */
    vote: number;
    /** thread title */
    title: string;
    /** category id */
    category: number;
    /** date string */
    lastModified: string;
    /** date string */
    createdAt: string;
    /** shortened link */
    slink: string;
    pin?: commentType;
}
