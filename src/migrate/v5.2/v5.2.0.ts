import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { exit } from "process";

dotenv.config();

async function migrate() {
    console.log("migrating to v5.2...");

    if (!process.env.DB_URI) throw new Error("Missing DB_URI environment variable.");

    const client = new MongoClient(process.env.DB_URI);
    await client.connect();
    const db = client.db("metahkg");
    const usersCl = db.collection("users");
    const verificationCl = db.collection("verification");

    await usersCl.updateMany({}, { $rename: { pwd: "password" } });
    await verificationCl.updateMany({}, { $rename: { pwd: "password" } });
}

migrate().then(() => {
    exit(0);
});
