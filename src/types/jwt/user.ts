import { Static, Type } from "@sinclair/typebox";
import dotenv from "dotenv";
import { SexSchema, UserNameSchema, UserRoleSchema } from "../../lib/schemas";

dotenv.config();

export const jwtTokenSchema = Type.Object({
    id: Type.Integer({ minimum: 1 }),
    name: UserNameSchema,
    sex: SexSchema,
    role: UserRoleSchema,
    iss: Type.Literal(process.env.domain || ""),
    aud: Type.Literal(process.env.domain || ""),
});

export type jwtTokenType = Static<typeof jwtTokenSchema>;
