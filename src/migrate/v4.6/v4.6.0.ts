import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { exit } from "process";

dotenv.config();

async function migrate() {
    console.log("migrating to v4.8...");

    if (!process.env.DB_URI) throw new Error("Missing DB_URI environment variable.");

    const client = new MongoClient(process.env.DB_URI);
    await client.connect();
    const db = client.db("metahkg");
    const threadCl = db.collection("thread");

    await threadCl.updateMany({ c: { $exists: true } }, [{ $set: { count: "$c" } }]);
    await threadCl.updateMany({ count: { $exists: true } }, { $unset: { c: 1 } });
}

migrate().then(() => {
    exit(0);
});
