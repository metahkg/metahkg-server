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

export interface conversation {
    /** mongodb assigned object id */
    _id: string;
    /** thread id */
    id: number;
    /** date string */
    lastModified: string;
    conversation: comment[];
}
