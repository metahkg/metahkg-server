import dotenv from "dotenv";
import { MongoClient } from "mongodb";
dotenv.config();
async function rc1() {
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

async function rc2() {
    const client = new MongoClient(process.env.DB_URI);
    await client.connect();
    const db = client.db("metahkg");
    const summaryCl = db.collection("summary");
    const usersCl = db.collection("users");
    const threadUsersCl = db.collection("threadusers");
    try {
        await threadUsersCl.drop();
    } catch {}
    await usersCl.find().forEach((item) => {
        if (item.user) {
            usersCl.updateOne(
                { _id: item._id },
                { $set: { name: item.user }, $unset: { user: 1 } }
            );
        }
    });
    await summaryCl.find().forEach((item) => {
        (async () => {
            if (typeof item.op !== "object") {
                summaryCl.updateOne(
                    {
                        _id: item._id,
                    },
                    {
                        $set: {
                            op: await usersCl.findOne(
                                { id: item.op },
                                {
                                    projection: {
                                        _id: 0,
                                        id: 1,
                                        name: 1,
                                        role: 1,
                                        sex: 1,
                                    },
                                }
                            ),
                        },
                    }
                );
            }
            if (item.user || item.catname || item.sex) {
                summaryCl.updateOne(
                    {
                        _id: item._id,
                    },
                    {
                        $unset: {
                            user: 1,
                            catname: 1,
                            sex: 1,
                        },
                    }
                );
            }
        })();
    });
}

//rc1();
rc2();
