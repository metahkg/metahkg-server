/*
 Copyright (C) 2022-present Metahkg Contributors

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { exit } from "process";

dotenv.config();

async function migrate() {
    console.log("migrating to v6.11.1...");

    if (!process.env.MONGO_URI)
        throw new Error("Missing MONGO_URI environment variable.");

    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db("metahkg");
    const threadCl = db.collection("thread");

    await Promise.all(
        (await threadCl.find({ removed: { $exists: false } }).toArray()).map(
            async (thread) => {
                thread.conversation = await Promise.all(
                    thread.conversation.map(async (comment: { comment: string }) => {
                        if (typeof comment.comment === "string") {
                            return {
                                ...comment,
                                comment: { type: "html", html: comment },
                            };
                        }
                    }),
                );
                await threadCl.updateOne(
                    { _id: thread._id },
                    { $set: { conversation: thread.conversation } },
                );
            },
        ),
    );
}

migrate().then(() => {
    exit(0);
});
