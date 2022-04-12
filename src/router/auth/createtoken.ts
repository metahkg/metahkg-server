import jwt from "jsonwebtoken";
import { userRole } from "../../types/db/users";
export function createToken(id: number, user: string, sex: "M" | "F", role: userRole) {
    const token = jwt.sign(
        {
            id: id,
            user: user,
            sex: sex,
            role: role,
            iss: process.env.domain,
            aud: process.env.domain,
        },
        process.env.jwtKey,
        { algorithm: "HS256", expiresIn: "7d" }
    );
    return token;
}
