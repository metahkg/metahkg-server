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
    console.log("migrating to v6.11.8...");

    if (!process.env.MONGO_URI)
        throw new Error("Missing MONGO_URI environment variable.");

    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db("metahkg");
    const usersCl = db.collection("users");
    const gamesCl = db.collection("games");

    await usersCl.updateMany(
        { "games.tokens": { $exists: false } },
        {
            $rename: { "games.guess.tokens": "games.tokens" },
        }
    );

    await Promise.all(
        (
            await gamesCl.find({ guesses: { $exists: true } }).toArray()
        ).map(async (game) => {
            game.guesses = await Promise.all(
                game.guesses.map(async (guess: { date?: Date }) => {
                    if (!guess.date) {
                        guess.date = new Date();
                    }
                    return guess;
                })
            );
            await gamesCl.updateOne(
                { _id: game._id },
                { $set: { guesses: game.guesses } }
            );
        })
    );

    await gamesCl.updateMany(
        { lastModified: { $exists: false } },
        { $currentDate: { lastModified: 1 } as unknown as any }
    );
}

migrate().then(() => {
    exit(0);
});
