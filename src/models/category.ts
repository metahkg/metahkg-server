import { ObjectId } from "mongodb";

export default class Category {
    constructor(
        public id: number,
        public name: string,
        public hidden?: boolean,
        public _id?: ObjectId,
    ) {}
}
