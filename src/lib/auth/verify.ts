import jwt from "jsonwebtoken";
import {ajv} from "../ajv";
import {jwtTokenSchema, jwtTokenType} from "jwt/user";

export default function verifyUser(token?: string): false | jwtTokenType {
    token = token?.slice(7);
    if (!token) return false;
    const jwtKey = process.env.jwtKey || "";
    try {
        const data = jwt.verify(token, jwtKey, {algorithms: ["HS256"]}) as jwtTokenType;
        if (!data || !ajv.validate(jwtTokenSchema, data)) return false;
        return data;
    } catch {
        return false;
    }
}
