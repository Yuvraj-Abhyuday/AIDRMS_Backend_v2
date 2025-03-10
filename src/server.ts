import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/index";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = "0.0.0.0";

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));

app.use(express.json());

app.use("/api", router);

try {
  app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}/`);
  });
} catch (error) {
  console.error("Error starting server:", error);
}
