/*
 Copyright (C) 2022-present Wong Chun Yat (wcyat)

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
import { createReadStream, readdirSync, rmSync } from "fs";
import { GridFSBucket, MongoClient } from "mongodb";
import { exit } from "process";

dotenv.config();

async function migrate() {
    console.log("migrating to v6.5...");

    if (!process.env.MONGO_URI)
        throw new Error("Missing MONGO_URI environment variable.");

    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db("metahkg");
    const usersCl = db.collection("users");
    const votesCl = db.collection("votes");

    await Promise.all(
        (await votesCl.find({}).project({ _id: 0 }).toArray()).map(async (v) => {
            const id = v.id;
            delete v.id;
            await usersCl.updateOne({ id }, { $set: { votes: v } });
            await votesCl.deleteOne({ id });
        }),
    );

    const avatarBucket = new GridFSBucket(db, { bucketName: "avatar" });

    const avatarFiles = readdirSync("images/avatars");

    await Promise.all(
        avatarFiles.map(async (file) => {
            await new Promise((resolve, reject) => {
                const stream = createReadStream(`./images/avatars/${file}`).pipe(
                    avatarBucket.openUploadStream(file, {
                        metadata: { id: Number(file[0]) },
                    }),
                );
                stream.on("finish", resolve);
                stream.on("error", reject);
            });
            rmSync(`./images/avatars/${file}`);
        }),
    );
}

migrate().then(() => {
    exit(0);
});
