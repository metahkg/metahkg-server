import { MongoClient } from "mongodb";
import { mongouri } from "../common";

async function main() {
    const client = new MongoClient(mongouri);
    await client.connect();
    const verification = client.db("metahkg-users").collection("verification");
    verification.dropIndex("createdAt_1");
    verification.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 3600 * 24 * 7 });
}
main();