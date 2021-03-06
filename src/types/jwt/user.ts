import { Static, Type } from "@sinclair/typebox";
import dotenv from "dotenv";

dotenv.config();

export const jwtTokenSchema = Type.Object({
    id: Type.Integer(),
    name: Type.String(),
    sex: Type.Union([Type.Literal("M"), Type.Literal("F")]),
    role: Type.Union([Type.Literal("admin"), Type.Literal("user")]),
    iss: Type.Literal(process.env.domain || ""),
    aud: Type.Literal(process.env.domain || ""),
});

export type jwtTokenType = Static<typeof jwtTokenSchema>;
