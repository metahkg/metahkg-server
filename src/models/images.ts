import { ObjectId } from "mongodb";

export type imageType = {
    /** image source url */
    src: string;
    /** comment id */
    cid: number;
};

export default interface Images {
    id: number;
    images: imageType[];
    _id?: ObjectId;
}
