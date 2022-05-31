import { viralCl } from "../common";
/**
 * Decrease collection "viral" documents count by 1
 for sorting popularity
 */
export async function autodecrement() {
    await viralCl.updateMany({}, { $inc: { c: -1 } });
}
