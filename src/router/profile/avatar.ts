/**
 * To deploy this service you must have an aws account
 * Create a s3 bucket in a region you want
 */
import dotenv from "dotenv";
import express from "express";
import multer from "multer"; //handle image uploads
import AWS from "aws-sdk";
import fs from "fs";
import { MongoClient } from "mongodb";
import { mongouri } from "../../common";
import sharp from "sharp"; //reshape images to circle
dotenv.config();
const router = express.Router();
const upload = multer({ dest: "uploads/" });
/*
 * Please specify awsRegion and s3Bucket in .env
 */
const region = process.env.awsRegion || "ap-northeast-1";
const bucket = process.env.s3Bucket || "metahkg";
/**
 * aws credentials are fetched from a
 * profile "s3" set in ~/.aws/credentials
 */
const credentials = new AWS.SharedIniFileCredentials({ profile: "s3" });
AWS.config.credentials = credentials;
AWS.config.update({ region: region });
const s3 = new AWS.S3({ apiVersion: "2006-03-01" });
/**
 * Upload an avatar to s3
 * The path would be /avatars/<user-id>
 */
async function uploadtos3(filename: string) {
  const uploadParams: {
    Bucket: string;
    Key: string;
    Body: string | fs.ReadStream;
    ContentType: string;
    CacheConfig: string;
  } = {
    Bucket: bucket, //change to your bucket name
    //get the filename without extension
    Key: `avatars/${filename.split("/").pop().split(".")[0]}`,
    Body: "",
    //change content type according to file extension
    ContentType: `image/${filename
      .split(".")
      .pop()
      .replace("jpg", "jpeg")
      .replace("svg", "svg+xml")}`,
    //disable s3 cache for the image
    CacheConfig: "no-cache",
  };
  const fileStream = fs.createReadStream(filename); //read file
  fileStream.on("error", (err) => {
    console.log("File Error", err);
  });
  uploadParams.Body = fileStream;
  //using promise to await
  await s3.upload(uploadParams).promise();
}
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
    .toFile(`${filename}.png`);
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
  const client = new MongoClient(mongouri);
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
  try {
    await client.connect();
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
    let newfilename = `${user.id}.${req.file.originalname.split(".").pop()}`;
    fs.rename(
      `uploads/${req.file.filename}`,
      `uploads/${newfilename}`,
      () => {}
    );
    //compress the file
    try {
      await compress(`uploads/${newfilename}`);
      newfilename += ".png";
      //upload file to s3
      await uploadtos3(`uploads/${newfilename}`);
      const url = `https://${bucket}.s3.amazonaws.com/avatars/${user.id}`;
      //save avatar url to db
      await users.updateOne({ id: user.id }, { $set: { avatar: url } });
    } catch {
      res.status(422);
      res.send({
        error: "Could not complete the request. Please check your file.",
      });
      fs.rm(`uploads/${newfilename}`, () => {});
      return;
    }
    res.send({
      success: true,
      url: `https://${bucket}.s3.amazonaws.com/avatars/${user.id}`,
    });
    //remove the file locally
    fs.rm(`uploads/${newfilename}`, () => {});
  } finally {
    await client.close();
  }
});
export default router;
