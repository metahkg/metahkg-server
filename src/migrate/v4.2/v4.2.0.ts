import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { exit } from "process";

dotenv.config();

async function migrate() {
    console.log("migrating to v4.2.0...");

    if (!process.env.DB_URI) throw new Error("Missing DB_URI environment variable.");

    const client = new MongoClient(process.env.DB_URI);
    await client.connect();
    const db = client.db("metahkg");
    const usersCl = db.collection("users");

    await Promise.all(
        (
            await usersCl.find().toArray()
        ).map(async (data) => {
            if (data.blocked && data.blocked.every((i: number) => typeof i === "number")) {
                await usersCl.updateOne(
                    {
                        _id: data._id,
                    },
                    {
                        $set: {
                            blocked: data.blocked.map((i: number) => ({
                                date: Date.now(),
                                reason: "",
                                id: i,
                            })),
                        },
                    }
                );
            }
        })
    );
}

migrate().then(() => {
    exit(0);
});
