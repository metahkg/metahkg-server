import jwt from "jsonwebtoken";
import { ajv } from "../ajv";
import { jwtTokenSchema, jwtTokenType } from "../../types/jwt/user";
import jwt_decode from "jwt-decode";

export default function verifyUser(token: string): false | jwtTokenType {
    token = token.slice(7);
    if (!token) return false;
    const jwtKey = process.env.jwtKey;
    try {
        const data = jwt.verify(token, jwtKey, { algorithms: ["HS256"] });
        if (!data || !ajv.validate(jwtTokenSchema, data)) return false;
    } catch {
        return false;
    }
    return jwt_decode(token);
}
