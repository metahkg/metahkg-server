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

dotenv.config();

async function migrate() {
    console.log("migrating to v6.1.0...");

    if (!process.env.MONGO_URI)
        throw new Error("Missing MONGO_URI environment variable.");

    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db("metahkg");
    const threadCl = db.collection("thread");
    const usersCl = db.collection("users");
    const linksCl = db.collection("links");
    const categoryCl = db.collection("category");
    const votesCl = db.collection("votes");
    const inviteCl = db.collection("invite");

    await threadCl.dropIndex("id_1");
    await usersCl.dropIndex("id_1");
    await usersCl.dropIndex("name_1");
    await usersCl.dropIndex("email_1");
    await linksCl.dropIndex("id_1");
    await categoryCl.dropIndex("id_1");
    await categoryCl.dropIndex("name_1");
    await votesCl.dropIndex("id_1");
    await inviteCl.dropIndex("code_1");
}

migrate().then(() => {
    exit(0);
});
