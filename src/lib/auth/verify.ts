import jwt from "jsonwebtoken";
import { ajv } from "../ajv";
import { jwtTokenSchema, jwtTokenType } from "../../types/jwt/user";
import dotenv from "dotenv";
import { getSessionByToken } from "../sessions/getSession";
import { sha256 } from "../sha256";

dotenv.config();

export default async function verifyUser(
    authorization: string,
    ip: string
): Promise<false | jwtTokenType> {
    const token = authorization?.slice(7);
    if (!token) return false;
    const jwtKey = process.env.jwtKey || "";
    try {
        const data = jwt.verify(token, jwtKey, { algorithms: ["HS256"] }) as jwtTokenType;
        if (!data || !ajv.validate(jwtTokenSchema, data)) return false;

        const session = await getSessionByToken(data.id, token);
        if (!session) return false;

        if (session.sameIp && sha256(ip) !== session.ip) return false;

        return data;
    } catch {
        return false;
    }
}
