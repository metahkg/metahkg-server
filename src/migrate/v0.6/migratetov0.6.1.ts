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
    await Promise.all(
        (
            await threadCl.find().toArray()
        ).map(async (item) => {
            if (item.pin && !item.pin.text) {
                const text = htmlToText(item.pin.html, {
                    wordwrap: false,
                });
                await threadCl.updateOne(
                    { id: item.id },
                    { $set: { "pin.text": text } }
                );
            }
            await Promise.all(
                item.conversation.map(async (comment: commentType, index: number) => {
                    let quote = comment.quote;

                    while (quote) {
                        if (!quote.text)
                            quote.text = htmlToText(quote.comment, { wordwrap: false });
                        quote = quote.quote;
                    }

                    if (!comment.text)
                        comment.text = htmlToText(comment.comment, { wordwrap: false });

                    await threadCl.updateOne(
                        { _id: item._id },
                        {
                            $set: {
                                [`conversation.${index}`]: comment,
                            },
                        }
                    );
                })
            );
        })
    );
}

addText().then(() => {exit(0)});
