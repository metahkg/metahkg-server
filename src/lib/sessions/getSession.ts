import { usersCl } from "../common";
import User from "../../models/user";
import { sha256 } from "../sha256";

export async function getSessionByToken(userId: number, token: string) {
    const hashedToken = sha256(token);
    const user = (await usersCl.findOne(
        {
            id: userId,
            sessions: { $elemMatch: { token: hashedToken } },
        },
        { projection: { sessions: { $elemMatch: { token: hashedToken } } } }
    )) as User;

    if (!user) return null;

    return user?.sessions[0];
}

export async function getSessionById(userId: number, sessionId: string) {
    const user = (await usersCl.findOne(
        {
            id: userId,
            sessions: { $elemMatch: { id: sessionId } },
        },
        { projection: { sessions: { $elemMatch: { id: sessionId } } } }
    )) as User;

    if (!user) return null;

    return user?.sessions[0];
}
