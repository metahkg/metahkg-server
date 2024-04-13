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

import { Static, Type } from "@sinclair/typebox";
import dotenv from "dotenv";
import { config } from "../lib/config";
import { SexSchema, UserNameSchema, UserRoleSchema } from "../lib/schemas";

dotenv.config();

export const jwtTokenDataSchema = Type.Object(
    {
        id: Type.Integer({ minimum: 1 }),
        name: UserNameSchema,
        sex: SexSchema,
        role: UserRoleSchema,
    },
    { additionalProperties: false },
);

export const jwtTokenSchema = Type.Intersect(
    [
        jwtTokenDataSchema,
        Type.Object(
            {
                /** issuer (your domain) */
                iss: Type.Literal(config.DOMAIN),
                /** auditor (your domain) */
                aud: Type.Literal(config.DOMAIN),
                /** issue date in seconds */
                iat: Type.Integer({ minimum: 0 }),
                /** expiration date in seconds */
                exp: Type.Integer({ minimum: 0 }),
            },
            { additionalProperties: false },
        ),
    ],
    {
        additionalProperties: false,
    },
);

export type jwtTokenType = Static<typeof jwtTokenSchema> | null;
export type jwtTokenDataType = Static<typeof jwtTokenDataSchema> | null;
