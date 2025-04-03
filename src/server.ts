import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { scrapeRSSFeed } from "./service/scrapper";
import router from "./routes/index";
import { pool } from "./config/database";
import http from "http";
import { Server } from "socket.io";

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT: number = Number(process.env.PORT) || 3000;
const HOST: string = "0.0.0.0";
const INTERVAL_MS: number = 24 * 60 * 60 * 1000; // 24 hours

// HTTP server and initialize (socket.io)
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

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

// WebSocket Connection
io.on("connection", (socket) => {
  console.log("Client connected: ", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected: ", socket.id);
  });
});

// Scheduled scraping
const startScheduledScraping = async (): Promise<void> => {
  const runScrape = async () => {
    try {
      console.log("Starting scheduled scraping...");
      await scrapeRSSFeed();
      console.log(`[${new Date().toISOString()}] Scheduled scrape completed`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Scheduled scrape failed:`, err);
    }
  };

  await runScrape(); // Initial scrape
  setInterval(runScrape, INTERVAL_MS); // Recurring scrape
};

// Database connection test
const testDbConnection = async (): Promise<void> => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Database connected successfully:", res.rows[0]);
  } catch (err) {
    console.error("Database connection failed:", err);
    throw err;
  }
};

// Listen for PostgreSQL Database Changes
const listenForDBChanges = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    await client.query("LISTEN new_data");

    client.on("notification", (msg) => {
      if (msg.payload) {
        const newEntry = JSON.parse(msg.payload);
        console.log("New database entry received: ", newEntry);
        io.emit("newEntry", newEntry);
      }
    });

    client.on("error", async (err) => {
      console.error("PostgreSQL Listener Error: ", err);
      client.release(); // Release the old client
      setTimeout(listenForDBChanges, 5000); // Try reconnecting in 5 seconds
    });

    client.on("end", async () => {
      console.warn("PostgreSQL Listener Disconnected. Reconnecting...");
      setTimeout(listenForDBChanges, 5000);
    });

  } catch (err) {
    console.error("Failed to set up PostgreSQL listener: ", err);
    setTimeout(listenForDBChanges, 5000); // Retry after 5 seconds
  }
};

// Server startup
const startServer = async (): Promise<void> => {
  try {
    await new Promise<void>((resolve) => {
      server.listen(PORT, HOST, () => {
        console.log(`Server running at http://${HOST}:${PORT}/`);
        resolve();
      });
    });

    // Test DB connection before proceeding
    await testDbConnection();

    // Listen for database changes
    await listenForDBChanges();

    // Log the current environment
    console.log(`Current NODE_ENV: ${process.env.NODE_ENV}`);

    // Start scraping
    // await startScheduledScraping();

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
