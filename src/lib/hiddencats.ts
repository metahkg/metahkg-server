import { db } from "../common";
export async function hiddencats() {
    const category = db.collection("category");
    return (await category.find({ hidden: true }).toArray()).map((item) => item.id);
}
