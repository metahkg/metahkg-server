import fs from "fs";
import { viralCl, summaryCl, limitCl, verificationCl, categoryCl } from "../common";
export async function setup() {
    if ((await categoryCl.find().toArray()).length) {
        console.log("documents found. not setting up again");
    } else {
        await categoryCl.insertMany(JSON.parse(fs.readFileSync("category.json", "utf8")));
        await viralCl.createIndex({ createdAt: 1 }, { expireAfterSeconds: 172800 });
        await summaryCl.createIndex({ op: "text", title: "text" }); //text search
        await limitCl.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
        await verificationCl.createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 });
    }
}
