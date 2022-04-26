import { viralCl, limitCl, verificationCl, categoryCl, threadCl } from "../common";
import { categories } from "./category";
export async function setup() {
    if ((await categoryCl.find().toArray()).length) {
        console.log("documents found. not setting up again");
    } else {
        await categoryCl.insertMany(categories);
        await viralCl.createIndex({ createdAt: 1 }, { expireAfterSeconds: 172800 });
        await threadCl.createIndex({ op: "text", title: "text" }); //text search
        await limitCl.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
        await verificationCl.createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 });
    }
}
