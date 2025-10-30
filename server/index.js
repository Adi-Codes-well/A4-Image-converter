import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path"; // Import path module
import removeBackgroundRoute from "./routes/removeBackground.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;


const allowedOrigins = [
  'http://localhost:5173', // Dev frontend
  'https://a4-image-converter.vercel.app', // Production frontend URL
  'https://a4-image-converter-1.onrender.com' // Production frontend URL
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true); 
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true // Crucial for session cookies, API tokens, etc.
}));
app.use("/api/remove-background", removeBackgroundRoute);

// Serve static files from the React app's build directory
app.use(express.static(path.join(process.cwd(), "client", "dist")));

// All other GET requests not handled by the API will return your React app
app.get(/.*/, (req, res) => { // Changed "/*" to a regex to match any path
  res.sendFile(path.resolve(process.cwd(), "client", "dist", "index.html"));
});

app.listen(PORT, () => console.log("Server running on port 5000"));
