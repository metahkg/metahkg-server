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
import { createHmac, randomBytes } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";

function generateHMACKey() {
    if (existsSync("certs/hmac.key")) {
        return console.info("HMAC key exists. Not generating a new hmac key.");
    }
    console.info("Generating a new HMAC key...");
    writeFileSync("certs/hmac.key", randomBytes(256).toString("hex"), { flag: "w" });
}

function getHMACKey() {
    if (!existsSync("certs/hmac.key")) {
        return "";
    }
    return readFileSync("certs/hmac.key", "utf-8").trim();
}

function HMACSign(data: string) {
    const hmac = createHmac("sha256", getHMACKey());
    hmac.update(data);
    return hmac.digest("base64url");
}

dotenv.config();

async function migrate() {
    console.log("migrating to v6.9...");

    if (!process.env.MONGO_URI)
        throw new Error("Missing MONGO_URI environment variable.");

    generateHMACKey();

    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db("metahkg");
    const threadCl = db.collection("thread");

    await Promise.all(
        (
            await threadCl
                .find({ images: { $exists: true }, removed: { $exists: false } })
                .toArray()
        ).map(async (v) => {
            let { images, conversation } = v;
            if (
                images?.every(
                    (i: { src: string; cid: number }) => i && !("signature" in i),
                )
            ) {
                images = images.map((i: { src: string; cid: number }) => {
                    if (i.src) {
                        return {
                            ...i,
                            signature: HMACSign(i.src),
                        };
                    }
                    return i;
                });
            }
            conversation = conversation.map((c: { images: string[] }) => {
                if (
                    !("removed" in c) &&
                    c.images?.every(
                        (i: any) => i && (typeof i === "string" || !("signature" in i)),
                    )
                ) {
                    return {
                        ...c,
                        images: c.images.map((i: any) => {
                            return {
                                src: i.src || i,
                                signature: HMACSign(i.src || i),
                            };
                        }),
                    };
                }
                return c;
            });
            await threadCl.updateOne({ _id: v._id }, { $set: { images, conversation } });
        }),
    );
}

migrate().then(() => {
    exit(0);
});
