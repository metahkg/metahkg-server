import { ObjectId } from "mongodb";

export type imageType = {
    /** image source url */
    src: string;
    /** comment id */
    cid: number;
};

export default class Images {
    constructor(public id: number, public images: imageType[], public _id?: ObjectId) {}
}
