import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { exit } from "process";
import User from "../models/user";
import { generate } from "wcyat-rg";
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
                                { name: item.op },
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

async function slinks() {
    if (!process.env.DB_URI || !process.env.LINKS_DOMAIN || !process.env.domain) {
        console.error("Please set DB_URI, LINKS_DOMAIN, domain in .env!!!");
        exit(1);
    }
    const LINKS_DOMAIN = process.env.LINKS_DOMAIN;
    const domain = process.env.domain;
    const client = new MongoClient(process.env.DB_URI);
    await client.connect();
    const db = client.db("metahkg");
    const linksCl = db.collection("links");
    const conversationCl = db.collection("conversation");
    const summaryCl = db.collection("summary");
    await summaryCl.find().forEach((item) => {
        if (!item.slink.startsWith(`https://${LINKS_DOMAIN}`)) {
            summaryCl.updateOne(
                { _id: item._id },
                { $set: { slink: `https://${LINKS_DOMAIN}/${item.id}` } }
            );
        }
    });
    await conversationCl.find().forEach((item) => {
        item.conversation.forEach(
            (comment: { slink: string; id: number }, index: number) => {
                (async () => {
                    if (!comment?.slink?.startsWith(`https://${LINKS_DOMAIN}`)) {
                        let slinkId = generate({
                            include: {
                                numbers: true,
                                upper: true,
                                lower: true,
                                special: false,
                            },
                            digits: 7,
                        });
                        while (await linksCl.findOne({ id: slinkId })) {
                            slinkId = generate({
                                include: {
                                    numbers: true,
                                    upper: true,
                                    lower: true,
                                    special: false,
                                },
                                digits: 7,
                            });
                        }
                        await linksCl.insertOne({
                            id: slinkId,
                            url: `/thread/${item.id}?c=${comment.id}`,
                        });
                        await conversationCl.updateOne(
                            { _id: item._id },
                            {
                                $set: {
                                    [`conversation.${index}.slink`]: `https://${LINKS_DOMAIN}/${slinkId}`,
                                },
                            }
                        );
                    }
                })();
            }
        );
    });
}

//rc1();
//rc2();
slinks();
