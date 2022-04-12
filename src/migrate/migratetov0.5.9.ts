import dotenv from "dotenv";
import { MongoClient } from "mongodb";
dotenv.config();
async function main() {
    const client = new MongoClient(process.env.DB_URI);
    await client.connect();
    const db = client.db("metahkg");
    const usersCl = db.collection("users");
    usersCl.find().forEach((user) => {
        if (!user.role) {
            usersCl.updateOne(
                { _id: user._id },
                {
                    $set: { role: user.admin ? "admin" : "user" },
                    $unset: { admin: 1, key: 1 },
                }
            );
        }
    });
}

main();
