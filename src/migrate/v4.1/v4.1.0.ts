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
    console.log("migrating to v4.1.0...");

    if (!process.env.DB_URI) throw new Error("Missing DB_URI environment variable.");

    const client = new MongoClient(process.env.DB_URI);
    await client.connect();
    const db = client.db("metahkg");
    const usersCl = db.collection("users");

    await Promise.all(
        (
            await usersCl.find().toArray()
        ).map(async (data) => {
            if (
                data.blocked &&
                data.blocked.every((i: number) => typeof i === "number")
            ) {
                await usersCl.updateOne(
                    {
                        _id: data._id,
                    },
                    {
                        $set: {
                            blocked: data.blocked.map((i: number) => ({
                                date: new Date(),
                                reason: "",
                                id: i,
                            })),
                        },
                    }
                );
            }
        })
    );
}

migrate().then(() => {
    exit(0);
});
