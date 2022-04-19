import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { exit } from "process";
import { comment } from "db/conversation";
import sanitize from "../lib/sanitize";
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
        item.conversation.forEach((comment: comment, index: number) => {
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

rc1();
