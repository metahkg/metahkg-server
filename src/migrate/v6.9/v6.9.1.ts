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
import { MongoClient, ObjectId } from "mongodb";
import { exit } from "process";
import { createHmac, randomBytes } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import parse from "node-html-parser";
import validUrl from "valid-url";

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

function findLinks(comment: string) {
    const parsed = parse(comment);
    const links: { url: string; signature: string }[] = [];
    parsed.querySelectorAll("a").forEach((item) => {
        const url = item.getAttribute("href");
        if (validUrl.isHttpsUri(url) || validUrl.isHttpUri(url)) {
            links.push({ url: url, signature: HMACSign(url) });
        }
    });
    return links;
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
            await threadCl.find({ removed: { $exists: false } }).toArray()
        ).map(async (v) => {
            let { conversation } = v as {
                _id: ObjectId;
                conversation: {
                    id: number;
                    links?: { url: string; signature: string }[];
                    comment: string;
                }[];
            };
            conversation = conversation.map((c) => {
                if (!("removed" in c) && !c.links) {
                    const linksInComment = findLinks(c.comment);
                    return {
                        ...c,
                        links: linksInComment,
                    };
                }

                return c;
            });
            await threadCl.updateOne({ _id: v._id }, { $set: { conversation } });
        })
    );
}

migrate().then(() => {
    exit(0);
});