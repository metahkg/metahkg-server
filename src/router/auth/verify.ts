import jwt from "jsonwebtoken";
import { ajv } from "../../lib/ajv";
import { jwtTokenSchema, jwtTokenType } from "../../types/jwt/user";
import jwt_decode from "jwt-decode";

export default function verifyUser(token: string): false | jwtTokenType {
    if (!token) return false;
    const key = process.env.jwtKey;
    const data = jwt.verify(token, key, { algorithms: ["HS256"] });
    if (!data || !ajv.validate(jwtTokenSchema, data)) return false;
    return jwt_decode(token);
}
