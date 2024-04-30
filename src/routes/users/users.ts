import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import RequireAdmin from "../../plugins/requireAdmin";
import { Static, Type } from "@sinclair/typebox";
import regex from "../../lib/regex";
import {
    EmailSchema,
    SexSchema,
    UserNameSchema,
    UserRoleSchema,
} from "../../lib/schemas";
import { usersCl } from "../../lib/common";
import { sha256 } from "../../lib/sha256";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    const querySchema = Type.Object(
        {
            id: Type.Optional(Type.RegExp(regex.integer)),
            name: Type.Optional(UserNameSchema),
            email: Type.Optional(EmailSchema),
            sex: Type.Optional(SexSchema),
            role: Type.Optional(UserRoleSchema),
            muted: Type.Optional(Type.RegExp(regex.boolean)),
            banned: Type.Optional(Type.RegExp(regex.boolean)),
            page: Type.Optional(Type.RegExp(regex.integer)),
            limit: Type.Optional(Type.RegExp(regex.integer)),
        },
        { additionalProperties: false },
    );

    fastify.get(
        "/",
        { preParsing: [RequireAdmin], schema: { querystring: querySchema } },
        async (
            req: FastifyRequest<{
                Querystring: Static<typeof querySchema>;
            }>,
            res,
        ) => {
            const id = Number(req.query.id);
            const page = Number(req.query.page || "1") || 1;
            const limit = Number(req.query.limit || "25") || 25;
            const muted =
                typeof req.query.muted === "string"
                    ? JSON.parse(req.query.muted)
                    : undefined;
            const banned =
                typeof req.query.banned === "string"
                    ? JSON.parse(req.query.banned)
                    : undefined;
            const { name, email, sex, role } = req.query;
            const emailHash = email ? sha256(email) : undefined;

            const users = await usersCl
                .find({
                    ...(id && { id }),
                    ...(name && { name }),
                    ...(emailHash && { email: emailHash }),
                    ...(sex && { sex }),
                    ...(role && { role }),
                    ...(muted && {
                        mute: { $exists: true },
                    }),
                    ...(banned && {
                        ban: { $exists: true },
                    }),
                })
                .project({
                    _id: 0,
                    id: 1,
                    createdAt: 1,
                    name: 1,
                    sex: 1,
                    role: 1,
                    mute: 1,
                    ban: 1,
                })
                .skip((page - 1) * limit)
                .limit(limit)
                .toArray();

            return res.send(users);
        },
    );

    done();
}
