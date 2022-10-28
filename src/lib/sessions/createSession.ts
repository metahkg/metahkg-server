import { randomBytes } from "crypto";
import { usersCl } from "../../common";
import { sha256 } from "../sha256";

export async function createSession(
    userId: number,
    token: string,
    userAgent: string,
    ip: string,
    sameIp?: boolean
) {
    const session = {
        id: randomBytes(15).toString("hex"),
        token: sha256(token),
        createdAt: new Date(),
        exp: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7),
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
