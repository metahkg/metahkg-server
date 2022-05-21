import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { exit } from "process";
import { commentType } from "../../models/thread";
import sanitize from "../../lib/sanitize";
import { parse } from "node-html-parser";
dotenv.config();
async function rc1() {
    const mongouri = process.env.DB_URI;
    if (!mongouri) {
        console.log("please configure DB_URI in .env!");
        exit(1);
    }
    const client = new MongoClient(mongouri);
    await client.connect();
    const db = client.db("metahkg");
    const conversationCl = db.collection("conversation");
    await conversationCl.find().forEach((item) => {
        item.conversation.forEach((comment: commentType, index: number) => {
            (async () => {
                !comment.removed &&
                    (await conversationCl.updateOne(
                        { _id: item._id },
                        {
                            $set: {
                                [`conversation.${index}.comment`]: sanitize(
                                    comment.comment
                                ),
                            },
                        }
                    ));
            })();
        });
    });
}

async function mergeThread() {
    const mongouri = process.env.DB_URI;
    if (!mongouri) {
        console.log("please configure DB_URI in .env!");
        exit(1);
    }
    const client = new MongoClient(mongouri);
    await client.connect();
    const db = client.db("metahkg");
    const threadCl = db.collection("thread");
    const conversationCl = db.collection("conversation");
    const summaryCl = db.collection("summary");
    await summaryCl.find().forEach((item) => {
        (async () => {
            const conversation = await conversationCl.findOne({ id: item.id });
            await threadCl.insertOne({
                ...item,
                conversation: conversation.conversation,
            });
        })();
    });
}

async function rc2() {
    const mongouri = process.env.DB_URI;
    if (!mongouri) {
        console.log("please configure DB_URI in .env!");
        exit(1);
    }
    const client = new MongoClient(mongouri);
    await client.connect();
    const db = client.db("metahkg");
    const threadCl = db.collection("thread");
    const usersCl = db.collection("users");
    await threadCl.find().forEach((item) => {
        const conversation: any[] = item.conversation;
        conversation.forEach((comment, index) => {
            !comment.removed &&
                (async () => {
                    if (typeof comment.user === "number") {
                        await threadCl.updateOne(
                            { _id: item._id },
                            {
                                $set: {
                                    [`conversation.${index}.user`]: await usersCl.findOne(
                                        {
                                            id: comment.user,
                                        },
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
                    const parsed = parse(comment.comment);
                    const quote =
                        parsed?.firstChild === parsed?.querySelector("blockquote") &&
                        parsed?.querySelector("blockquote div")?.innerHTML;
                    if (quote) {
                        const quotedComment = conversation.find(
                            (i) => i.comment === quote
                        );
                        if (quotedComment) {
                            conversation[index].quote = quotedComment;
                            conversation[index].comment = parsed
                                .removeChild(parsed?.querySelector("blockquote"))
                                .toString();
                            await threadCl.updateOne(
                                { _id: item._id },
                                {
                                    $set: {
                                        [`conversation.${index}.quote`]: quotedComment,
                                        [`conversation.${index}.comment`]: parsed
                                            .removeChild(
                                                parsed?.querySelector("blockquote")
                                            )
                                            .toString(),
                                    },
                                }
                            );
                        }
                    }
                })();
        });
    });
}

//rc1();
//mergeThread();
rc2();
