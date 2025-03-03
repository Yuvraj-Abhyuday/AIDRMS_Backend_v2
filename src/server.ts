// src/app.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import router from "./routes/index";
import authRoutes from "./routes/auth.routes"; // if you have separate auth routes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Mount API routes
app.use("/api", router);
app.use("/", authRoutes);

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/aidrms", {
  })
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("MongoDB connection error:", error));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
