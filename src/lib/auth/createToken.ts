import jwt from "jsonwebtoken";
import { jwtTokenType } from "../../types/jwt/user";
import { userSex, userRole } from "../../types/user";
import dotenv from "dotenv";
import { domain } from "../common";

dotenv.config();

export function createToken(user: {
    id: number;
    name: string;
    sex: userSex;
    role: userRole;
}) {
    const { id, name, sex, role } = user;
    const jsonData: jwtTokenType = {
        id,
        name,
        sex,
        role,
        iss: domain || "",
        aud: domain || "",
    };
    const token = jwt.sign(jsonData, process.env.jwtKey || "", {
        algorithm: "HS256",
        expiresIn: "7d",
    });
    return token;
}
