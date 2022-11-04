import { Static, Type } from "@sinclair/typebox";
import dotenv from "dotenv";
import { SexSchema, UserNameSchema, UserRoleSchema } from "../lib/schemas";

dotenv.config();

export const jwtTokenDataSchema = Type.Object(
    {
        id: Type.Integer({ minimum: 1 }),
        name: UserNameSchema,
        sex: SexSchema,
        role: UserRoleSchema,
    },
    { additionalProperties: false }
);

export const jwtTokenSchema = Type.Intersect(
    [
        jwtTokenDataSchema,
        Type.Object(
            {
                /** issuer (your domain) */
                iss: Type.Literal(process.env.domain || ""),
                /** auditor (your domain) */
                aud: Type.Literal(process.env.domain || ""),
                /** issue date in seconds */
                iat: Type.Integer({ minimum: 0 }),
                /** expiration date in seconds */
                exp: Type.Integer({ minimum: 0 }),
            },
            { additionalProperties: false }
        ),
    ],
    {
        additionalProperties: false,
    }
);

export type jwtTokenType = Static<typeof jwtTokenSchema> | null;
export type jwtTokenDataType = Static<typeof jwtTokenDataSchema> | null;
