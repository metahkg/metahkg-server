import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { exit } from "process";
import findimages from "../../lib/findimages";
import { commentType } from "../../models/thread";

dotenv.config();

async function migrate() {
    console.log("migrating to v3.1.0...");

    if (!process.env.DB_URI) throw new Error("Missing DB_URI environment variable.");

    const client = new MongoClient(process.env.DB_URI);
    await client.connect();
    const db = client.db("metahkg");
    const threadCl = db.collection("thread");

    await Promise.all(
        (
            await threadCl.find().toArray()
        ).map(async (data) => {
            await threadCl.updateOne(
                {
                    id: data.id,
                },
                {
                    $set: {
                        ...(data.images.every(
                            (image: { image: string; cid: number }) => image.image
                        ) && {
                            images: data.images.map(
                                (i: { image: string; cid: number }) => ({
                                    src: i.image,
                                    cid: i.cid,
                                })
                            ),
                        }),
                        score: data.vote ?? data.score,
                    },
                    $unset: { vote: 1 },
                }
            );
            await Promise.all(
                data.conversation.map(async (comment: commentType, index: number) => {
                    if (comment && !comment?.removed)
                        await threadCl.updateOne(
                            {
                                id: data.id,
                            },
                            {
                                $set: {
                                    [`conversation.${index}.images`]:
                                        findimages(comment.comment) || [],
                                },
                            }
                        );
                })
            );
        })
    );
}

migrate().then(() => {
    exit(0);
});
