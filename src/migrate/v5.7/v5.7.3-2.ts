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
import { MongoClient, ObjectId } from "mongodb";
import { exit } from "process";
import EmailValidator from "email-validator";
import { sha256 } from "hash.js";

dotenv.config();

async function migrate() {
    console.log("migrating to v5.7.2...");

    if (!process.env.MONGO_URI)
        throw new Error("Missing MONGO_URI environment variable.");

    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db("metahkg");
    const verificationCl = db.collection("verification");

    await Promise.all(
        (
            await verificationCl
                .find({ email: { $exists: true } })
                .project({ email: 1, _id: 1 })
                .toArray()
        ).map(async (doc: { _id: ObjectId; email: string }) => {
            // if is email = not yet hashed
            if (EmailValidator.validate(doc.email)) {
                await verificationCl.updateOne(
                    { _id: doc._id },
                    { $set: { email: sha256().update(doc.email).digest("hex") } }
                );
            }
        })
    );

    await db.collection("limit").drop();
}

migrate().then(() => {
    exit(0);
});
