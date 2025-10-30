import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import removeBackgroundRoute from "./routes/removeBackground.js";

dotenv.config();
const app = express();
app.use(cors());
app.use("/api/remove-background", removeBackgroundRoute);

app.listen(5000, () => console.log("Server running on port 5000"));
