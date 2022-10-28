import { usersCl } from "../../common";
import User from "../../models/user";
import { sha256 } from "../sha256";

export async function updateSessionById(userId: number, sessionId: string, newToken: string) {
    const user = (await usersCl.findOne(
        { id: userId, sessions: { $elemMatch: { id: sessionId } } },
        {
            projection: {
                index: { $indexOfArray: ["$sessions.id", sessionId] },
                sessions: { $elemMatch: { id: sessionId } },
            },
        }
    )) as User & { index: number };

    const index = user?.index;
    if (index === -1) return null;

    const session = user?.sessions[0];

    await usersCl.updateOne(
        { id: userId },
        {
            $set: {
                [`sessions.${index}`]: {
                    ...session,
                    exp: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7),
                    token: newToken
                },
            },
        }
    );

    return true;
}

export async function updateSessionByToken(userId: number, token: string, newToken: string) {
    const hashedToken = sha256(token)
    const user = (await usersCl.findOne(
        { id: userId, sessions: { $elemMatch: { token: hashedToken } } },
        {
            projection: {
                index: { $indexOfArray: ["$sessions.token", hashedToken] },
                sessions: { $elemMatch: { token: hashedToken } },
            },
        }
    )) as User & { index: number };

    const index = user?.index;
    if (index === -1) return null;

    const session = user?.sessions[0];

    await usersCl.updateOne(
        { id: userId },
        {
            $set: {
                [`sessions.${index}`]: {
                    ...session,
                    exp: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7),
                    token: newToken
                },
            },
        }
    );

    return true;
}
