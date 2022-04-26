import { categoryCl, db } from "../common";
export async function hiddencats() {
    return (await categoryCl.find({ hidden: true }).toArray()).map((item) => item.id);
}
