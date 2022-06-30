import jwt from "jsonwebtoken";
import { jwtTokenType } from "../../types/jwt/user";
import { userSex, userRole } from "../../types/user";
import dotenv from "dotenv";

dotenv.config();

export function createToken(user: {
    id: number;
    name: string;
    sex: userSex;
    role: userRole;
}) {
    const { id, name, sex, role } = user;
    const jsonData: jwtTokenType = {
        id: id,
        name: name,
        sex: sex,
        role: role,
        iss: process.env.domain || "",
        aud: process.env.domain || "",
    };
    const token = jwt.sign(jsonData, process.env.jwtKey || "", {
        algorithm: "HS256",
        expiresIn: "7d",
    });
    return token;
}
