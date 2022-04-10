import {MongoClient} from "mongodb";
import {mongouri} from "../common";

async function vindex() {
    const client = new MongoClient(mongouri);
    await client.connect();
    const verification = client.db("metahkg-users").collection("verification");
    verification.dropIndex("createdAt_1");
    verification.createIndex(
        {createdAt: 1},
        {expireAfterSeconds: 3600 * 24 * 7}
    );
}

async function rmcatname() {
    const client = new MongoClient(mongouri);
    await client.connect();
    const summary = client.db("metahkg-threads").collection("summary");
    summary.find().forEach((item) => {
        (async () => {
            if (item.catname) {
                summary.updateOne({_id: item._id}, {$unset: {catname: true}});
            }
        })();
    });
}

vindex();
rmcatname();
