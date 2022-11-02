import { usersCl } from "../common";
import { sha256 } from "../sha256";
import jwt, { JwtPayload } from "jsonwebtoken";

export async function updateSessionById(
    userId: number,
    sessionId: string,
    newToken: string
) {
    // jwt exp is in seconds
    const newExp = (jwt.decode(newToken) as JwtPayload)?.exp * 1000;
    if (!newExp) return null;

    if (
        !(
            await usersCl.updateOne(
                { id: userId, sessions: { $elemMatch: { id: sessionId } } },
                {
                    $set: {
                        "sessions.$.exp": new Date(newExp),
                        "sessions.$.token": sha256(newToken),
                    },
                }
            )
        ).matchedCount
    )
        return null;

    return true;
}

export async function updateSessionByToken(
    userId: number,
    token: string,
    newToken: string
) {
    // jwt exp is in seconds
    const newExp = (jwt.decode(newToken) as JwtPayload)?.exp * 1000;
    if (!newExp) return null;

    const hashedToken = sha256(token);
    if (
        !(
            await usersCl.updateOne(
                { id: userId, sessions: { $elemMatch: { token: hashedToken } } },
                {
                    $set: {
                        "sessions.$.exp": new Date(newExp),
                        "sessions.$.token": sha256(newToken),
                    },
                }
            )
        ).matchedCount
    )
        return null;

    return true;
}
