import { db } from "../../common";
/**
 * Decrease collection "viral" documents count by 1
 for sorting popularity
 */
export async function autodecrement() {
    const viral = db.collection("viral");
    await viral.updateMany({}, { $inc: { c: -1 } });
}
