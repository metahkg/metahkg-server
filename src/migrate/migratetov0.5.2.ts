import { MongoClient } from "mongodb";
import isInteger from "is-sn-integer";
import dotenv from "dotenv";
dotenv.config();
const mongouri = process.env.DB_URI;
(async () => {
    const client = new MongoClient(mongouri);
    await client.connect();
    const summary = client.db("metahkg-threads").collection("summary");
    const users = client.db("metahkg-threads").collection("users");
    const metahkgusers = client.db("metahkg-users").collection("users");
    const verification = client.db("metahkg-users").collection("verification");
    summary.find().forEach((i) => {
        if (typeof i.sex !== "boolean") {
            summary.updateOne({ _id: i._id }, { $set: { sex: i.sex === "male" } });
        }
    });
    users.find().forEach((i) => {
        Object.entries(i).forEach((i1) => {
            if (isInteger(i1[0]) && typeof i1[1].sex !== "boolean") {
                users.updateOne(
                    { _id: i._id },
                    { $set: { [`${i1[0]}.sex`]: i1[1].sex === "male" } }
                );
            }
        });
    });
    metahkgusers.find().forEach((i) => {
        if (typeof i.sex !== "boolean") {
            metahkgusers.updateOne({ _id: i._id }, { $set: { sex: i.sex === "male" } });
        }
    });
    verification.find().forEach((i) => {
        if (typeof i.sex !== "boolean") {
            verification.updateOne({ _id: i._id }, { $set: { sex: i.sex === "male" } });
        }
    });
})();
