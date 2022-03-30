//logout
//GET /api/logout
import dotenv from "dotenv";
dotenv.config();
import express from "express";
const router = express.Router();
router.get("/api/logout", (req, res) => {
  res.cookie("key", "none", {
    expires: new Date(Date.now() + 1),
    httpOnly: true,
  });
  res
    .status(200)
    .json({ success: true, message: "User logged out successfully" });
});
export default router;
