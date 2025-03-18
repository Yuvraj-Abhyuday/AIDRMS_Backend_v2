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

// Retrieve all stored alerts from the database
export const getData = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT * FROM alerts ORDER BY expires DESC");
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