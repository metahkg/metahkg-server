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
import { ReasonSchemaAdmin, HTMLCommentSchema } from "../../../../../lib/schemas";
import { objectFilter } from "../../../../../lib/objectFilter";
import Thread from "../../../../../models/thread";
import sanitize from "../../../../../lib/sanitize";
import findImages from "../../../../../lib/findImages";
import findLinks from "../../../../../lib/findLinks";

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: (err?: Error) => void,
) {
    const paramsSchema = Type.Object({
        id: Type.RegEx(regex.integer),
        cid: Type.RegEx(regex.integer),
    });

    const schema = Type.Object(
        {
            html: HTMLCommentSchema,
            reason: ReasonSchemaAdmin,
        },
        { minProperties: 2, additionalProperties: false },
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
            res,
        ) => {
            const id = Number(req.params.id);
            const cid = Number(req.params.cid);
            const { reason } = req.body;

            const thread = (await threadCl.findOne(
                { id },
                {
                    projection: {
                        _id: 0,
                        pin: 1,
                        conversation: { $elemMatch: { id: cid } },
                    },
                },
            )) as Thread;

            const comment = !("removed" in thread) && thread.conversation[0];
            if (!("removed" in comment) && comment.comment.type !== "html") {
                return res.code(409).send({
                    statusCode: 409,
                    error: "Only html comments can be edited",
                });
            }

            const admin = objectFilter(req.user, (key: string) =>
                ["id", "name", "sex", "role"].includes(key),
            );

            const html = sanitize(req.body.html);
            const text = htmlToText(html);

            const imagesInComment = findImages(html);
            const linksInComment = findLinks(html);

            await threadCl.updateOne(
                { id, conversation: { $elemMatch: { id: cid } } },
                {
                    $set: {
                        "conversation.$.comment.html": html,
                        "conversation.$.text": text,
                        "conversation.$.images": imagesInComment,
                        "conversation.$.links": linksInComment,
                        ...(!("removed" in thread) &&
                            thread.pin?.id === cid && {
                                "pin.comment.html": html,
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
                },
            );

            // edit quotes of the comment
            // first order only
            // TODO: edit higher orders (need to do it recursively)
            await threadCl.updateOne(
                { id },
                {
                    $set: {
                        "conversation.$[elem].quote.comment.html": html,
                        "conversation.$[elem].quote.text": text,
                    },
                },
                { arrayFilters: [{ "elem.quote.id": cid }] },
            );

            res.code(204).send();
        },
    );
    done();
}
