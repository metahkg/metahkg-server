import { MongoClient } from "mongodb";
import findimages from "../lib/findimages";
import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
const mongouri = process.env.DB_URI;
async function images() {
    const client = new MongoClient(mongouri);
    await client.connect();
    const metahkgThreads = client.db("metahkg-threads");
    const conversation = metahkgThreads.collection("conversation");
    const images = metahkgThreads.collection("images");
    await conversation.find().forEach((item) => {
        (async () => {
            if (!(await images.findOne({ id: item.id }))) {
                const cimages: { image: string; cid: number }[] = [];
                item.conversation.forEach((citem: { comment?: string; id: number }) => {
                    if (citem.comment) {
                        findimages(citem.comment).forEach((c: string) => {
                            const index = cimages.findIndex((i) => i.image === c);
                            if (index === -1) {
                                cimages.push({ image: c, cid: citem.id });
                            } else {
                                if (cimages[index].cid > item.cid) {
                                    cimages.splice(index, 1);
                                    cimages.push({ image: c, cid: citem.id });
                                }
                            }
                        });
                    }
                });
                await images.insertOne({ id: item.id, images: cimages });
            }
        })();
    });
}

async function avatars() {
    const client = new MongoClient(mongouri);
    await client.connect();
    const users = client.db("metahkg-users").collection("users");
    fs.mkdir("images/avatars", { recursive: true }, (e) => {
        console.log(e);
    });
    await users.find().forEach((item) => {
        (async () => {
            if (item.avatar) {
                await axios
                    .get(item.avatar, { responseType: "stream" })
                    .then(async (res) => {
                        res.data.pipe(
                            fs.createWriteStream(`images/avatars/${item.id}.png`)
                        );
                        await users.updateOne(
                            { _id: item._id },
                            { $unset: { avatar: true } }
                        );
                    });
            }
        })();
    });
}

async function onedb() {
    const client = new MongoClient(mongouri);
    await client.connect();
    const db = client.db("metahkg");
    const metahkgThreads = client.db("metahkg-threads");
    const metahkgUsers = client.db("metahkg-users");
    try {
        await db
            .collection("users")
            .insertMany(await metahkgUsers.collection("users").find().toArray());
    } catch {}
    try {
        await db
            .collection("verification")
            .insertMany(await metahkgUsers.collection("verification").find().toArray());
    } catch {}
    try {
        await db
            .collection("votes")
            .insertMany(await metahkgUsers.collection("votes").find().toArray());
    } catch {}
    try {
        await db
            .collection("banned")
            .insertMany(await metahkgUsers.collection("banned").find().toArray());
    } catch {}
    try {
        await db
            .collection("limit")
            .insertMany(await metahkgUsers.collection("limit").find().toArray());
    } catch {}
    try {
        await db
            .collection("category")
            .insertMany(await metahkgThreads.collection("category").find().toArray());
    } catch {}
    try {
        await db
            .collection("summary")
            .insertMany(await metahkgThreads.collection("summary").find().toArray());
    } catch {}
    try {
        await db
            .collection("conversation")
            .insertMany(await metahkgThreads.collection("conversation").find().toArray());
    } catch {}
    try {
        await db
            .collection("images")
            .insertMany(await metahkgThreads.collection("images").find().toArray());
    } catch {}
    try {
        await db
            .collection("viral")
            .insertMany(await metahkgThreads.collection("viral").find().toArray());
    } catch {}
    try {
        await db
            .collection("threadusers")
            .insertMany(await metahkgThreads.collection("users").find().toArray());
    } catch {}
    await db
        .collection("viral")
        .createIndex({ createdAt: 1 }, { expireAfterSeconds: 172800 });
    await db.collection("summary").createIndex({ op: "text", title: "text" }); //text search
    await db
        .collection("limit")
        .createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
    await db
        .collection("verification")
        .createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 });
}

//images();
//avatars();
onedb();
