//deleted at two dats after createdAt date
export interface viral {
    /** mongodb object id */
    _id: string;
    /** thread id */
    id: number;
    /** date string, updated on comment if less than current date by 1 day or more */
    createdAt: string;
    /** date string, updated on comment */
    lastModified: string;
    /** initially 1 upon thread creation. Automatically decrease by 1
     * upon each 2 hours. Increased by 1 upon each comment.
     * used to sort viral */
    c: number;
    /** category id */
    category: number;
}
