export type imageType = {
    /** image source url */
    src: string;
    /** comment id */
    cid: number;
};
export interface images {
    /** mongodb object id */
    _id: string;
    /** thread id */
    id: number;
    /** images list */
    images: imageType[];
}
