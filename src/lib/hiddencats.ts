import { categoryCl } from "./common";
import Category from "../models/category";
export async function hiddencats() {
    return ((await categoryCl.find({ hidden: true }).toArray()) as Category[]).map(
        (item) => item.id
    );
}
