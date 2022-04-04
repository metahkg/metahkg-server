/**
 * To deploy this service you must have an aws account
 * Create a s3 bucket in a region you want
 */
import dotenv from "dotenv";
import express from "express";
import multer from "multer"; //handle image uploads
import fs from "fs";
import { client } from "../../common";
import sharp from "sharp"; //reshape images to circle
import { move } from "fs-extra";
dotenv.config();
const router = express.Router();
const upload = multer({ dest: "uploads/" });
/**
 * Compress the image to a 200px * 200px circle
 * Output is <original-filename>.png
 */
async function compress(filename: string) {
  const width = 200;
  const r = width / 2;
  const circleShape = Buffer.from(
    //avg circle
    `<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`
  );
  //use sharp to resize
  await sharp(filename)
    .resize(width, width)
    .composite([
      {
        input: circleShape,
        blend: "dest-in",
      },
    ])
    .toFile(filename.replace(filename.split(".").pop(), "png"));
  //remove the original
  fs.rm(filename, () => {});
}
/**
 * Image is saved to uploads/ upon uploading
 * only jpg, svg, png and jpeg are allowed
 * Image is renamed to <user-id>.<png/svg/jpg/jpeg>
 *  Then compressed and uploaded to s3
 * Image is delted locally after the process
 */
router.post("/api/avatar", upload.single("avatar"), async (req, res) => {
  if (!req.file?.size) {
    res.status(400);
    res.send({ error: "Bad request." });
    return;
  }
  if (req.file?.size > 100000) {
    res.status(422);
    res.send({ error: "file too large." });
    fs.rm(req.file?.path, () => {});
    return;
  }
  if (
    //check if file type is not aupported
    !["jpg", "svg", "png", "jpeg"].includes(
      req.file?.originalname.split(".").pop()
    )
  ) {
    res.status(400);
    res.send({ error: "File type not supported." });
    //remove the file
    fs.rm(req.file?.path, () => {});
    return;
  }
  const users = client.db("metahkg-users").collection("users");
  //search for the user using cookie "key"
  const user = await users.findOne({ key: req.cookies.key });
  //send 404 if no such user
  if (!user) {
    res.status(400);
    res.send({ error: "User not found." });
    fs.rm(`uploads/${req.file.originalname}`, () => {});
    return;
  }
  //rename file to <user-id>.<extension>
  const newfilename = `${user.id}.${req.file.originalname.split(".").pop()}`;
  const compressedfilename = `${user.id}.png`;
  fs.mkdir("images/processing/avatars", { recursive: true }, () => {});
  fs.mkdir("images/avatars", { recursive: true }, () => {});
  //move file to processing folder
  move(
    `uploads/${req.file.filename}`,
    `images/processing/avatars/${newfilename}`,
    () => {}
  );
  //compress the file
  try {
    await compress(`images/processing/avatars/${newfilename}`);
    fs.rm(`images/avatars/${compressedfilename}`, () => {});
    move(
      `images/processing/avatars/${compressedfilename}`,
      `images/avatars/${compressedfilename}`,
      () => {}
    );
  } catch {
    res.status(422);
    res.send({
      error: "Could not complete the request. Please check your file.",
    });
    fs.rm(`images/processing/${newfilename}`, () => {});
    return;
  }
  res.send({ response: "ok" });
});
export default router;
