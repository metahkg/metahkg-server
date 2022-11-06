import dotenv from "dotenv";
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import multer from "fastify-multer"; // handle image uploads
import { File } from "fastify-multer/lib/interfaces";
import fs from "fs";
import { move } from "fs-extra";
import sharp from "sharp"; // reshape images to circle

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
        try {
            fs.rmSync(`images/avatars/${id}.png`);
        } catch {}
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
            .catch((err) => console.log(err));
        await move(`tmp/avatars/${id}.png`, `images/avatars/${id}.png`, {
            overwrite: true,
        });
    }
    /**
     * Image is saved to uploads/ upon uploading
     * only jpg, svg, png and jpeg are allowed
     * Image is renamed to <user-id>.<png/svg/jpg/jpeg>
     */
    fastify.put(
        "/",
        { preHandler: [RequireSameUser, upload.single("avatar")] },
        async (req, res) => {
            try {
                const file = req.file as unknown as File;
                if (!file)
                    return res.code(400).send({ statusCode: 400, error: "Bad request." });

                if (file?.size > maxSize) {
                    fs.rm(file?.path, (err) => {
                        console.error(err);
                    });
                    return res
                        .code(413)
                        .send({ statusCode: 413, error: "File too large." });
                }
                if (!/^image\/(png|svg|jpg|jpeg|jfif|gif|webp)$/i.test(file.mimetype)) {
                    //remove the file
                    fs.rm(file?.path, (err) => {
                        console.error(err);
                    });
                    return res
                        .code(415)
                        .send({ statusCode: 415, error: "File type not supported." });
                }
                const user = req.user;
                if (!user) {
                    fs.rm(`uploads/${file?.filename}`, (err) => {
                        console.error(err);
                    });
                    return res
                        .code(401)
                        .send({ statusCode: 401, error: "Unauthorized." });
                }

                //rename file to <user-id>.<extension>
                const newFileName = `${user.id}.${file.originalname.split(".").pop()}`;
                fs.mkdirSync("images/processing/avatars", { recursive: true });
                fs.mkdirSync("images/avatars", { recursive: true });
                //move file to processing folder
                await move(`${file?.path}`, `images/processing/avatars/${newFileName}`, {
                    overwrite: true,
                });
                try {
                    //compress the file
                    await compress(`images/processing/avatars/${newFileName}`, user.id);
                    //fs.rmSync(`images/processing/avatars/${newFileName}`);
                } catch (err) {
                    console.error(err);
                    res.code(422).send({
                        statusCode: 422,
                        error: "Could not process you file.",
                    });
                    fs.rm(`images/processing/avatars/${newFileName}`, (err) => {
                        console.error(err);
                    });
                    return;
                }
                res.send({ success: true });
            } catch (err) {
                console.error(err);
                res.code(500).send({ statusCode: 500, error: "Internal server error." });
            }
        }
    );
    done();
}
