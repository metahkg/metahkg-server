import { randomBytes } from "crypto";
import { usersCl } from "../common";
import { sha256 } from "../sha256";
import jwt, { JwtPayload } from "jsonwebtoken";

export async function createSession(
    userId: number,
    token: string,
    userAgent: string,
    ip: string,
    sameIp?: boolean
) {
    const exp = (jwt.decode(token) as JwtPayload)?.exp * 1000
    if (!exp) return null;

    const session = {
        id: randomBytes(15).toString("hex"),
        token: sha256(token),
        createdAt: new Date(),
        exp: new Date(exp),
        userAgent,
        ip: sha256(ip),
        ...(sameIp && { sameIp }),
    };

    while (
        await usersCl.findOne({
            id: userId,
            sessions: { $elemMatch: { id: session.id } },
        })
    ) {
        session.id = randomBytes(15).toString("hex");
    }

    if (
        !(
            await usersCl.updateOne(
                { id: userId },
                {
                    $push: {
                        sessions: session,
                    },
                }
            )
        ).modifiedCount
    )
        return null;

    return session;
}
