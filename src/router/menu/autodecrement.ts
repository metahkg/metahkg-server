import {client} from "../../common";

/**
 * Decrease collection "hottest" documents count by 1
 for sorting popularity
 */
export async function autodecrement() {
    const hottest = client.db("metahkg-threads").collection("hottest");
    await hottest.updateMany({}, {$inc: {c: -1}});
}
