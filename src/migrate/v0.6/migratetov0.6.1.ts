import { MongoClient } from "mongodb";
import { exit } from "process";
import { commentType } from "../../models/thread";
import { htmlToText } from "html-to-text";
import dotenv from "dotenv";

dotenv.config();
const mongouri = process.env.DB_URI;

if (!mongouri) {
    console.log("please configure DB_URI in .env!");
    exit(1);
}

const client = new MongoClient(mongouri);

async function addText() {
    await client.connect();
    const db = client.db("metahkg");
    const threadCl = db.collection("thread");
    await threadCl.find().forEach((item) => {
        item.conversation.forEach((comment: commentType, index: number) => {
            if (!comment.text) {
                (async () => {
                    await threadCl.updateOne(
                        { _id: item._id },
                        {
                            $set: {
                                [`conversation.${index}.text`]: htmlToText(
                                    comment.comment,
                                    { wordwrap: false }
                                ),
                            },
                        }
                    );
                })();
            }
        });
    });
}

addText().then(() => {});
