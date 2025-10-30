import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path"; // Import path module
import removeBackgroundRoute from "./routes/removeBackground.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use("/api/remove-background", removeBackgroundRoute);

// Serve static files from the React app's build directory
app.use(express.static(path.join(process.cwd(), "client", "dist")));

// All other GET requests not handled by the API will return your React app
app.get(/.*/, (req, res) => { // Changed "/*" to a regex to match any path
  res.sendFile(path.resolve(process.cwd(), "client", "dist", "index.html"));
});

app.listen(PORT, () => console.log("Server running on port 5000"));
