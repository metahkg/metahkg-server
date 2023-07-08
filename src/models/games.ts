import { ObjectId } from "mongodb";
import { publicUserType } from "./thread";

export type Game = {
    _id?: ObjectId;
    id: string;
    host: publicUserType;
    createdAt: Date;
    endedAt?: Date;
} & {
    type: "guess";
    title: string;
    options: { text: string; odds?: number; tokens?: number }[];
    // total number of tokens
    tokens?: number;
    // index of answer (can have multiple)
    answer?: number[];
    guesses?: {
        user: publicUserType;
        option: number;
        // tokens used for gambit
        tokens: number;
    }[];
};
