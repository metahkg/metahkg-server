import { ObjectId } from "mongodb";
import { userRole, userSex } from "../types/user";
export default class User {
    constructor(
        public id: number,
        public createdAt: Date,
        public name: string,
        public email: string,
        public pwd: string,
        public sex: userSex,
        public role: userRole,
        public _id?: ObjectId
    ) {}
}
