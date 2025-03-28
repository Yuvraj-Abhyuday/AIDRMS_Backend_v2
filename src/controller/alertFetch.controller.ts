import { Request, Response } from "express";
import { scrapeRSSFeed } from "../service/api_scrapper";
import pool from "../models/postgresAlert.model";
import { AlertData } from "../interface/alert.interface";

// Trigger scraping and store data
export const fetchDataAndStore = async (req: Request, res: Response) => {
  try {
    const alerts = await scrapeRSSFeed();
    res.status(200).json({
      message: "Scraping completed successfully",
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error during scraping",
      error: (error as Error).message,
    });
  }
};

// Getting data from CAP and store data
export const fetchDataFromCap = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      identifier,
      sender,
      scope,
      urgency,
      severity,
      certainty,
      expires,
      affected_area,
      instruction,
      event,
      pincode,
      headline,
      created_at, // Added missing field from frontend
    } = req.body;

    // Required fields validation
    const requiredFields = {
      identifier,
      sender,
      expires,
      affected_area,
      instruction,
      event,
      headline,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value || (typeof value === "string" && !value.trim()))
      .map(([key]) => key);

    if (missingFields.length > 0) {
      res.status(400).json({ 
        message: `Missing required fields: ${missingFields.join(", ")}` 
      });
      return;
    }

    await pool.query("BEGIN");

    const queryText = `
      INSERT INTO alerts (
        identifier, sender, scope, urgency, severity, certainty, expires,
        affected_area, instruction, event, pincode, headline, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING identifier;
    `;
    const values = [
      identifier,
      sender,
      scope || "Public", // Default value
      urgency || "Unknown", // Default value
      severity || "Unknown", // Default value
      certainty || "Unknown", // Default value
      expires,
      affected_area,
      instruction,
      event,
      pincode || null, // Allow null for optional field
      headline,
      created_at || new Date().toISOString(), // Default to current time if not provided
    ];

    const result = await pool.query(queryText, values);

    await pool.query("COMMIT");

    res.status(201).json({
      message: "Alert submitted successfully",
      identifier: result.rows[0].identifier,
    });
  } catch (err: any) {
    await pool.query("ROLLBACK");
    console.error("Error submitting CAP alert:", err.message);
    res.status(500).json({ 
      message: "Internal server error",
      error: err.message 
    });
  }
};

// Retrieve all stored alerts from the database
export const getData = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM alerts ORDER BY expires DESC"
    );
    const alerts: AlertData[] = result.rows;
    res.status(200).json({
      message: "Alerts retrieved successfully",
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving alerts",
      error: (error as Error).message,
    });
  } finally {
    client.release();
  }
};