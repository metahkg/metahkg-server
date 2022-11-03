import { ObjectId } from "mongodb";
import { publicUserType } from "./thread";

export interface PollOptionType {
    /** number of votes */
    votes: number;
    /** title */
    title: string;
    /** description */
    description?: string;
}

export interface Poll {
    /** mongodb object id */
    _id?: ObjectId;
    /** random 20-digit string */
    id: string;
    /** user who created the poll */
    user: publicUserType;
    /** title of poll */
    title: string;
    /** description of poll */
    description?: string;
    /** poll created at */
    createAt: Date;
    /** poll options */
    options: PollOptionType[];
    /** votes */
}
