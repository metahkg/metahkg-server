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

import {
    limitCl,
    verificationCl,
    categoryCl,
    threadCl,
    usersCl,
    linksCl,
    votesCl,
    inviteCl,
} from "../lib/common";
import { categories } from "./category";
export async function setup() {
    await threadCl.createIndex({ id: 1 });
    await usersCl.createIndex({ id: 1 });
    await usersCl.createIndex({ name: 1 });
    await usersCl.createIndex({ email: 1 });
    await linksCl.createIndex({ id: 1 });
    await categoryCl.createIndex({ id: 1 });
    await categoryCl.createIndex({ name: 1 });
    await votesCl.createIndex({ id: 1 });
    await inviteCl.createIndex({ code: 1 });

    await threadCl.createIndex({ title: "text" }); // text search
    await limitCl.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
    await verificationCl.createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 });

    if ((await categoryCl.find().toArray()).length)
        console.log("categories found. not inserting again.");
    else await categoryCl.insertMany(categories);
}
