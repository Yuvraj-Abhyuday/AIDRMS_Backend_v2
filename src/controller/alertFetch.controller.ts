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

// Getting data from Cap  and store data
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
      headline,
    } = req.body;

    if (
      !identifier ||
      !sender ||
      !scope ||
      !urgency ||
      !severity ||
      !certainty ||
      !expires ||
      !affected_area ||
      !instruction ||
      !event ||
      !headline
    ) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    await pool.query("BEGIN");

    const queryText = `
      INSERT INTO alerts (
        identifier, sender, scope, urgency, severity, certainty, expires,
        affected_area, instruction, event, headline, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW());
    `;
    const values = [
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
      headline,
    ];

    await pool.query(queryText, values);

    await pool.query("COMMIT");

    res.status(201).json({
      message: "Alert submitted successfully",
      identifier: identifier, // Return identifier instead of id
    });
  } catch (err: any) {
    await pool.query("ROLLBACK");
    console.error("Error submitting CAP alert:", err.message);
    res.status(500).json({ message: "Internal server error" });
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
