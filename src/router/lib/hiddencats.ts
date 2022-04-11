import {client} from "../../common";

export async function hiddencats() {
    const category = client.db("metahkg-threads").collection("category");
    return (await category.find({hidden: true}).toArray()).map(
        (item) => item.id
    );
}
