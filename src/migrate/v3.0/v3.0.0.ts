import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { exit } from "process";

dotenv.config();

async function migrate() {
    console.log("migrating to v3.0.0rc1...");

    if (!process.env.DB_URI) throw new Error("Missing DB_URI environment variable.");

    const client = new MongoClient(process.env.DB_URI);
    await client.connect();
    const db = client.db("metahkg");
    const threadCl = db.collection("thread");
    const imagesCl = db.collection("images");

    await Promise.all(
        (
            await imagesCl.find().toArray()
        ).map(async (data) => {
            await threadCl.updateOne(
                {
                    id: data.id,
                },
                { $set: { images: data.images } }
            );
            await imagesCl.deleteOne({ id: data.id });
        })
    );
}

migrate().then(() => {
    exit(0);
});
