import { Static, Type } from "@sinclair/typebox";
import { Router } from "express";
import { ajv } from "../../lib/ajv";
import verifyUser from "../../lib/auth/verify";
import { usersCl } from "../../common";
import User from "../../models/user";

const router = Router();

const schema = Type.Object({
    userId: Type.Integer({ minimum: 1 }),
});

router.post(
    "/api/users/unblock",
    async (
        req: { body: Static<typeof schema>; headers: { authorization?: string } },
        res
    ) => {
        const { userId } = req.body;
        const user = verifyUser(req.headers.authorization);

        if (!ajv.validate(schema, req.body) || !user)
            return res.status(400).json({ error: "Bad request." });

        try {
            const blocked = (
                (await usersCl.findOneAndUpdate(
                    { id: user.id },
                    [{ $pull: { blocked: userId } }],
                    { returnDocument: "after" }
                )) as unknown as User
            )?.blocked;
            return res.send({ blocked, success: true });
        } catch {
            return res.status(500).json({ error: "Internal server error." });
        }
    }
);
