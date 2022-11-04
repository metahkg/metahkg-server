import {
    limitCl,
    verificationCl,
    categoryCl,
    threadCl,
    usersCl,
    linksCl,
    votesCl,
    inviteCl,
} from "../lib/common";
import { categories } from "./category";
export async function setup() {
    await threadCl.createIndex({ id: 1 });
    await usersCl.createIndex({ id: 1 });
    await usersCl.createIndex({ name: 1 });
    await usersCl.createIndex({ email: 1 });
    await linksCl.createIndex({ id: 1 });
    await categoryCl.createIndex({ id: 1 });
    await categoryCl.createIndex({ name: 1 });
    await votesCl.createIndex({ id: 1 });
    await inviteCl.createIndex({ code: 1 });

    await threadCl.createIndex({ title: "text" }); // text search
    await limitCl.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
    await verificationCl.createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 });

    if ((await categoryCl.find().toArray()).length)
        console.log("categories found. not inserting again.");
    else await categoryCl.insertMany(categories);
}
