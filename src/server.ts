import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/index";
import bodyParser from "body-parser";
import authRoutes from "./routes/auth.routes";
import { scrapeRSSFeed } from "./service/api_scrapper";
import postSOS from "./routes/sos.routes";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";
const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Middleware
app.use(bodyParser.json());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api", router);
app.use("/api", postSOS);

// Scheduled Scraping
function startScheduledScraping() {
  // Initial scrape on server start
  scrapeRSSFeed().catch((err) => console.error("Initial scrape failed:", err));

  // Schedule every 24 hours
  setInterval(() => {
    console.log(`[${new Date().toISOString()}] Starting scheduled scrape...`);
    scrapeRSSFeed().catch((err) =>
      console.error("Scheduled scrape failed:", err)
    );
  }, INTERVAL_MS);
}

// Start Server

try {
  app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}/`);
    // startScheduledScraping();
  });
} catch (error) {
  console.error("Error starting server:", error);
}