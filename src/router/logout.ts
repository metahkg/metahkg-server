//logout
//GET /api/logout
import dotenv from "dotenv";
dotenv.config();
import express from "express";
const router = express.Router();
router.get("/api/logout", (req, res) => {
  res.cookie("key", "none", {
    expires: new Date(Date.now() + 5),
    httpOnly: true,
    domain: process.env.domain,
  });
  res
    .status(200)
    .json({ success: true, message: "User logged out successfully" });
});
export default router;