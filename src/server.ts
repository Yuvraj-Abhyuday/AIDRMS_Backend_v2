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

// Create HTTP server and initialize WebSocket
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL || "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(bodyParser.json({ limit: "10mb" }));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
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
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});


// Function to test PostgreSQL connection

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
    console.log("✅ Database connected successfully:", res.rows[0]);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);

  }
};

// Function to listen for PostgreSQL database changes
const listenForDBChanges = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    await client.query("LISTEN new_data");

    client.on("notification", (msg) => {
      if (msg.payload) {
        try {
          const payload = JSON.parse(msg.payload);

          if (payload.table && payload.data) {
            console.log("📌 New database entry received:", payload);
            io.emit("newEntry", payload); // ✅ Now includes { table: ..., data: ... }
          } else {
            console.error("❌ Invalid database notification format:", payload);
          }
        } catch (error) {
          console.error("❌ Error parsing database notification payload:", error);
        }
      } else {
        console.warn("⚠️ Notification received but payload is empty");
      }
    });

    client.on("error", (err) => {
      console.error("❌ PostgreSQL Listener Error:", err);
    });

    console.log("📡 Listening for real-time database changes...");
  } catch (error) {
    console.error("❌ Failed to set up database listener:", error);
  }
};

// Server startup
const startServer = async (): Promise<void> => {
  try {
    server.listen(PORT, HOST, () => {
      console.log(`🚀 Server running at http://${HOST}:${PORT}/`);
    });

    await testDbConnection();
    await listenForDBChanges();
    // Start scraping
    await startScheduledScraping();
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle process errors
process.on("uncaughtException", (err: Error) => console.error("❌ Uncaught Exception:", err));
process.on("unhandledRejection", (err: unknown) => console.error("❌ Unhandled Rejection:", err));

// Start server
startServer();

export default app;
