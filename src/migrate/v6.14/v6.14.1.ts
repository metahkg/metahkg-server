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
import { MongoClient } from "mongodb";
import { exit } from "process";
import { System } from "../../models/system";
import Thread from '../../models/thread';

dotenv.config();

async function migrate() {
    console.log("migrating to v6.14.1...");

    if (!process.env.MONGO_URI)
        throw new Error("Missing MONGO_URI environment variable.");

    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db("metahkg");
    const threadCl = db.collection("thread");
    const usersCl = db.collection("users");
    const systemCl = db.collection("system");
    if (!await systemCl.findOne()) {
        await systemCl.insertOne({
            lastUserId: (((await usersCl.find().sort({ id: -1 }).limit(1).toArray()))[0]
                ?.id) || 0,
            lastThreadId: (
                (await threadCl
                    .find()
                    .project({ id: 1, _id: 0 })
                    .sort({ id: -1 })
                    .limit(1)
                    .toArray()) as Thread[]
            )[0]?.id || 0
        } as System)
    }
}

migrate().then(() => {
    exit(0);
});
