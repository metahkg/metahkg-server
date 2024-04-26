/*
 Copyright (C) 2022-present Wong Chun Yat (wcyat)

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
import { threadCl } from "../../../../../lib/common";

import regex from "../../../../../lib/regex";
import checkComment from "../../../../../plugins/checkComment";
import RequireAdmin from "../../../../../plugins/requireAdmin";
import { ReasonSchemaAdmin, CommentSchema } from "../../../../../lib/schemas";
import { objectFilter } from "../../../../../lib/objectFilter";
import Thread from "../../../../../models/thread";
import sanitize from "../../../../../lib/sanitize";
import findimages from "../../../../../lib/findimages";
import findLinks from "../../../../../lib/findLinks";

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

            const { reason } = req.body;

            const comment = sanitize(req.body.comment);

            const text = htmlToText(comment);

            const thread = (await threadCl.findOne(
                { id },
                {
                    projection: {
                        _id: 0,
                        pin: 1,
                        index: { $indexOfArray: ["$conversation.id", cid] },
                        conversation: 1,
                    },
                }
            )) as Thread & { index: number };

            const imagesInComment = findimages(comment);
            const linksInComment = findLinks(comment);

            await threadCl.updateOne(
                { id, conversation: { $elemMatch: { id: cid } } },
                {
                    $set: {
                        "conversation.$.comment": comment,
                        "conversation.$.text": text,
                        "conversation.$.images": imagesInComment,
                        "conversation.$.links": linksInComment,
                        ...(!("removed" in thread) &&
                            thread.pin?.id === cid && {
                                "pin.comment": comment,
                                "pin.text": text,
                            }),
                    },
                    $push: {
                        "conversation.$.admin.edits": {
                            admin,
                            reason,
                            date: new Date(),
                        },
                    },
                }
            );

            // edit quotes of the comment
            // first order only
            // TODO: edit higher orders (need to do it recursively)
            await threadCl.updateOne(
                { id },
                {
                    $set: {
                        "conversation.$[elem].quote.comment": comment,
                        "conversation.$[elem].quote.text": text,
                    },
                },
                { arrayFilters: [{ "elem.quote.id": cid }] }
            );

            res.code(204).send();
        }
    );
    done();
}
