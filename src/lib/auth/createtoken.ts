import jwt from "jsonwebtoken";
import { jwtTokenType } from "../../types/jwt/user";
import { userRole } from "../../types/user";
export function createToken(id: number, name: string, sex: "M" | "F", role: userRole) {
    const jsonData: jwtTokenType = {
        id: id,
        name: name,
        sex: sex,
        role: role,
        iss: process.env.domain,
        aud: process.env.domain,
    };
    const token = jwt.sign(jsonData, process.env.jwtKey, {
        algorithm: "HS256",
        expiresIn: "7d",
    });
    return token;
}
