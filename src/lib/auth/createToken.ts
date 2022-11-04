import { jwtTokenDataType } from "../../types/jwt";
import { userSex, userRole } from "../../models/user";
import dotenv from "dotenv";
import { JWT } from "@fastify/jwt";

dotenv.config();

export function createToken(
    fastifyJWT: JWT,
    user: {
        id: number;
        name: string;
        sex: userSex;
        role: userRole;
    }
) {
    const { id, name, sex, role } = user;
    const jsonData: jwtTokenDataType = {
        id,
        name,
        sex,
        role,
    };
    const token = fastifyJWT.sign(jsonData);
    return token;
}
