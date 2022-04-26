import { ObjectId } from "mongodb";
import { imageType } from "../types/db/images";

export default class Images {
    constructor(public id: number, public images: imageType[], public _id?: ObjectId) {}
}
