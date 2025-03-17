import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/index";
import bodyParser from "body-parser";
import authRoutes from "./routes/auth.routes";
import postSOS from "./routes/sos.routes";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";
app.use(bodyParser.json());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));

app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", router);
app.use("/api", postSOS);
try {
  app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}/`);
  });
} catch (error) {
  console.error("Error starting server:", error);
}
