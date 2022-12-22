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

import { jwtTokenDataType } from "../../types/jwt";
import { userSex, userRole } from "../../models/user";
import dotenv from "dotenv";
import { JWT } from "@fastify/jwt";

dotenv.config();

export function createToken(
    fastifyJWT: JWT,
    user: {
        id: number;
        name: string;
        sex: userSex;
        role: userRole;
    }
) {
    const { id, name, sex, role } = user;
    const jsonData: jwtTokenDataType = {
        id,
        name,
        sex,
        role,
    };
    const token = fastifyJWT.sign(jsonData);
    return token;
}
