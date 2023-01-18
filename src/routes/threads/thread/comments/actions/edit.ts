/*
 Copyright (C) 2022-present Metahkg Contributors

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { Static, Type } from "@sinclair/typebox";
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { htmlToText } from "html-to-text";
import { ObjectId } from "mongodb";
import { threadCl } from "../../../../../lib/common";

import regex from "../../../../../lib/regex";
import checkComment from "../../../../../plugins/checkComment";
import RequireAdmin from "../../../../../plugins/requireAdmin";
import { ReasonSchemaAdmin, CommentSchema } from "../../../../../lib/schemas";
import { objectFilter } from "../../../../../lib/objectFilter";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
        cid: Type.RegEx(regex.integer),
    });

    const schema = Type.Object(
        {
            comment: CommentSchema,
            reason: ReasonSchemaAdmin,
        },
        { minProperties: 2, additionalProperties: false }
    );

    fastify.patch(
        "/:cid",
        {
            schema: { params: paramsSchema, body: schema },
            preParsing: [RequireAdmin],
            preHandler: [checkComment],
        },
        async (
            req: FastifyRequest<{
                Params: Static<typeof paramsSchema>;
                Body: Static<typeof schema>;
            }>,
            res
        ) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);

            const admin = objectFilter(req.user, (key: string) =>
                ["id", "name", "sex", "role"].includes(key)
            );

            const { comment, reason } = req.body;

            const text = htmlToText(comment);

            const index = (
                (await threadCl.findOne(
                    { id },
                    {
                        projection: {
                            _id: 0,
                            index: { $indexOfArray: ["$conversation.id", cid] },
                        },
                    }
                )) as { _id: ObjectId; index: number }
            )?.index;

            await threadCl.updateOne(
                { id },
                {
                    $set: {
                        [`conversation.${index}.comment`]: comment,
                        [`conversation.${index}.text`]: text,
                    },
                    $push: {
                        [`conversation.${index}.admin.edits`]: {
                            admin,
                            reason,
                            date: new Date(),
                        },
                    },
                }
            );

            return res.send({ success: true });
        }
    );
    done();
}
