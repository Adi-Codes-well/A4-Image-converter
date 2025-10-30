import express from "express";
import axios from "axios";
import multer from "multer";
import FormData from "form-data";

const router = express.Router();
const upload = multer();

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append("image_file", req.file.buffer, req.file.originalname);
    formData.append("size", "auto");

    const response = await axios.post("https://api.remove.bg/v1.0/removebg", formData, {
      headers: {
        ...formData.getHeaders(),
        "X-Api-Key": process.env.REMOVE_BG_API_KEY,
      },
      responseType: "arraybuffer",
    });

    res.set("Content-Type", "image/png");
    res.send(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Background removal failed" });
  }
});

export default router;
