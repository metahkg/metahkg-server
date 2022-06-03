import dotenv from "dotenv";
import multer from "multer"; //handle image uploads
import fs from "fs";
import { move } from "fs-extra";
import sharp from "sharp"; //reshape images to circle
import verifyUser from "../../lib/auth/verify";
import { Router } from "express";

dotenv.config();

const upload = multer({ dest: "uploads/" });

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
        `<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`,
    );
    fs.rmSync(`images/avatars/${id}.png`);
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
        .toFile(`${process.env.root}/tmp/avatars/${id}.png`)
        .catch((err) => console.log(err));
    await move(
        `${process.env.root}/tmp/avatars/${id}.png`,
        `${process.env.root}/images/avatars/${id}.png`,
        { overwrite: true },
    );
}

const router = Router();
/**
 * Image is saved to uploads/ upon uploading
 * only jpg, svg, png and jpeg are allowed
 * Image is renamed to <user-id>.<png/svg/jpg/jpeg>
 */
router.post("/api/users/avatar", upload.single("avatar"), async (req, res) => {
    if (!req.file?.size) return res.status(400).send({ error: "Bad request." });
    if (req.file?.size > 150000) {
        fs.rm(req.file?.path, (err) => {
            console.error(err);
        });
        return res.status(422).send({ error: "file too large." });
    }
    if (
        //check if file type is not aupported
        !["jpg", "svg", "png", "jpeg", "jfif"].includes(
            req.file?.originalname?.split(".")?.pop() || "",
        )
    ) {
        //remove the file
        fs.rm(req.file?.path, (err) => {
            console.error(err);
        });
        return res.status(400).send({ error: "File type not supported." });
    }
    const user = verifyUser(req.headers.authorization);
    //send 404 if no such user
    if (!user) {
        fs.rm(`${process.env.root}/uploads/${req.file?.filename}`, (err) => {
            console.error(err);
        });
        return res.status(400).send({ error: "User not found." });
    }
    //rename file to <user-id>.<extension>
    const newFileName = `${user.id}.${req.file.originalname.split(".").pop()}`;
    fs.mkdirSync("images/processing/avatars", { recursive: true });
    fs.mkdirSync("images/avatars", { recursive: true });
    //move file to processing folder
    await move(
        `${process.env.root}/${req.file?.path}`,
        `${process.env.root}/images/processing/avatars/${newFileName}`,
        { overwrite: true },
    );
    try {
        //compress the file
        await compress(`images/processing/avatars/${newFileName}`, user.id);
        fs.rmSync(`images/processing/avatars/${newFileName}`);
    } catch {
        res.status(422);
        res.send({
            error: "Could not complete the request. Please check your file.",
        });
        fs.rm(`images/processing/avatars/${newFileName}`, (err) => {
            console.error(err);
        });
        return;
    }
    res.send({ response: "ok" });
});

export default router;
