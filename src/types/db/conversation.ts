export interface conversation {
    /** mongodb assigned object id */
    _id: string;
    /** thread id */
    id: number;
    /** date string */
    lastModified: string;
    conversation: (
        | {
              /** comment id */
              id: number;
              /** user id */
              user: number;
              /** html string */
              comment: string;
              /** date string */
              createdAt: string;
              /** shortened link */
              slink: string;
          }
        | {
              /** comment removed */
              removed: true;
              /** comment id */
              id: number;
          }
    )[];
}
