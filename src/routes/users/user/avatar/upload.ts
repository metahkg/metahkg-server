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

import { RateLimitOptions } from "@fastify/rate-limit";
import dotenv from "dotenv";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import multer from "fastify-multer"; // handle image uploads
import { File } from "fastify-multer/lib/interfaces";
import fs from "fs";
import sharp from "sharp"; // reshape images to circle
import { avatarBucket as bucket } from "../../../../lib/common";

import RequireSameUser from "../../../../plugins/requireSameUser";

dotenv.config();

export default function (
    fastify: FastifyInstance,
    _opts: FastifyPluginOptions,
    done: () => void
) {
    const maxSize = 1048576;
    const upload = multer({ dest: "uploads/", limits: { fileSize: maxSize } });

    /**
     * Compress the image to a 200px * 200px circle
     * Output is <original-filename>.png
     */
    async function compress(filename: string, id: number) {
        const width = 200,
            height = 200;
        const r = width / 2;
        const circleShape = Buffer.from(
            //svg circle
            `<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`
        );
        //use sharp to resize
        fs.mkdirSync(`tmp/avatars`, { recursive: true });
        await sharp(filename)
            .resize(width, height)
            .composite([
                {
                    input: circleShape,
                    blend: "dest-in",
                },
            ])
            .toFormat("png")
            .toFile(`tmp/avatars/${id}.png`)
            .catch((err) => fastify.log.error(err));
    }
    /**
     * Image is saved to uploads/ upon uploading
     * only jpg, svg, png and jpeg are allowed
     * Image is renamed to <user-id>.<png/svg/jpg/jpeg>
     */
    fastify.put(
        "/",
        {
            preParsing: [RequireSameUser],
            preHandler: [upload.single("avatar")],
            config: {
                rateLimit: <RateLimitOptions>{
                    max: 10,
                    ban: 5,
                    timeWindow: 1000 * 60 * 60,
                },
            },
        },
        async (req, res) => {
            try {
                const file = req.file as unknown as File;
                if (!file)
                    return res.code(400).send({ statusCode: 400, error: "Bad request" });

                if (file?.size > maxSize) {
                    fs.rm(file?.path, (err) => {
                        fastify.log.error(err);
                    });
                    return res
                        .code(413)
                        .send({ statusCode: 413, error: "File too large" });
                }
                if (!/^image\/(png|svg|jpg|jpeg|jfif|gif|webp)$/i.test(file.mimetype)) {
                    //remove the file
                    fs.rm(file?.path, (err) => {
                        fastify.log.error(err);
                    });
                    return res
                        .code(415)
                        .send({ statusCode: 415, error: "File type not supported" });
                }
                const user = req.user;
                if (!user) {
                    fs.rm(`uploads/${file?.filename}`, (err) => {
                        fastify.log.error(err);
                    });
                    return res.code(401).send({ statusCode: 401, error: "Unauthorized" });
                }

                try {
                    // compress the file
                    await compress(file.path, user.id);
                    const oldFile = (
                        await bucket.find({ "metadata.id": user.id }).toArray()
                    )?.[0];
                    await new Promise((resolve, reject) => {
                        const uploadStream = fs
                            .createReadStream(`tmp/avatars/${user.id}.png`)
                            .pipe(
                                bucket.openUploadStream(`${user.id}.png`, {
                                    metadata: { id: user.id },
                                })
                            );
                        uploadStream.on("error", reject);
                        uploadStream.on("close", resolve);
                    });
                    if (oldFile) {
                        await bucket.delete(oldFile._id);
                    }
                } catch (err) {
                    fastify.log.error(err);
                    res.code(422).send({
                        statusCode: 422,
                        error: "Could not process your file",
                    });
                    fs.rm(file.path, (err) => {
                        fastify.log.error(err);
                    });
                    return;
                }
                res.code(204).send();
            } catch (err) {
                fastify.log.error(err);
                res.code(500).send({ statusCode: 500, error: "Internal server error" });
            }
        }
    );
    done();
}
