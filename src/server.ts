import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { scrapeRSSFeed } from "./service/api_scrapper";
import router from "./routes/index";
import { pool } from "./config/database"; // Import pool to test connection

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT: number = Number(process.env.PORT) || 3000;
const HOST: string = "0.0.0.0";
const INTERVAL_MS: number = 24 * 60 * 60 * 1000; // 24 hours

// Middleware setup
app.use(bodyParser.json({ limit: "10mb" }));
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  optionsSuccessStatus: 200,
}));
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api", router);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
});

// Test database connection
const testDbConnection = async (): Promise<void> => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Database connected successfully:", res.rows[0]);
  } catch (err) {
    console.error("Database connection failed:", err);
    throw err; // Let startServer handle the exit
  }
};

// Scheduled scraping
const startScheduledScraping = async (): Promise<void> => {
  const runScrape = async () => {
    try {
      await scrapeRSSFeed();
      console.log(`[${new Date().toISOString()}] Scheduled scrape completed`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Scheduled scrape failed:`, err);
    }
  };

  await runScrape(); // Initial scrape
  setInterval(runScrape, INTERVAL_MS); // Recurring scrape
};

// Server startup
const startServer = async (): Promise<void> => {
  try {
    await new Promise<void>((resolve) => {
      app.listen(PORT, HOST, () => {
        console.log(`Server running at http://${HOST}:${PORT}/`);
        resolve();
      });
    });

    // Test DB connection before proceeding
    await testDbConnection();

    if (process.env.NODE_ENV !== "test") {
      await startScheduledScraping();
    }
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Process handlers
process.on("uncaughtException", (err: Error) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err: unknown) => {
  console.error("Unhandled Rejection:", err);
});

// Start server
startServer();

export default app;