import type { userSex } from "../user";
import type { userRole } from "../user";

export type comment = {
    /** comment id */
    id: number;
    /** if removed all below attributes doesn't exist!!! */
    removed?: true;
    /** user id */
    user: number;
    /** html string */
    comment: string;
    /** date string */
    createdAt: string;
    /** shortened link */
    slink: string;
};

export type threadOp = {
    id: number;
    name: string;
    sex: userSex;
    role: userRole;
};

export interface thread {
    /** mongodb object id */
    _id: string;
    /** thread id */
    id: number;
    /** original poster */
    op: threadOp;
    /** number of comments */
    c: number;
    /** conversation */
    conversation: comment[];
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
}
