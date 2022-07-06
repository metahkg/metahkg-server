import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { exit } from "process";

dotenv.config();

async function migrate() {
    console.log("migrating to v2.5.3...");

    if (!process.env.DB_URI) throw new Error("Missing DB_URI environment variable.");

    const client = new MongoClient(process.env.DB_URI);
    await client.connect();
    const db = client.db("metahkg");
    const threadCl = db.collection("thread");
    await threadCl.dropIndex("op_text_title_text");
    await threadCl.createIndex({ title: "text" });
    console.log("migration complete!");
    exit(0);
}

migrate();
