import dotenv from "dotenv";
import isInteger from "is-sn-integer";
import { MongoClient } from "mongodb";
import { exit } from "process";

dotenv.config();

async function migrate() {
    console.log("migrating to v3.2.0...");

    if (!process.env.DB_URI) throw new Error("Missing DB_URI environment variable.");

    const client = new MongoClient(process.env.DB_URI);
    await client.connect();
    const db = client.db("metahkg");
    const votesCl = db.collection("votes");

    await Promise.all(
        (
            await votesCl.find().toArray()
        ).map(async (data) => {
            if (Object.entries(data).every((i) => !Array.isArray(i[1])))
                await votesCl.updateOne(
                    {
                        id: data.id,
                    },
                    {
                        $set: Object.fromEntries(
                            Object.entries(data).map((t) => {
                                if (isInteger(t[0]))
                                    t[1] = Object.entries(t[1]).map((i) => ({
                                        cid: Number(i[0]),
                                        vote: i[1],
                                    }));
                                return t;
                            })
                        ),
                    }
                );
        })
    );
}

migrate().then(() => {
    exit(0);
});
