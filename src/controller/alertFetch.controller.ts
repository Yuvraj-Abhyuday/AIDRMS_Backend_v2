import axios from "axios";
import pool from "../models/postgresAlert.model";
import { Request, Response } from "express";
import { parseStringPromise } from "xml2js";

export const fetchDataAndStore = async (req: Request, res: Response) => {
  try {
    const apiResponse = await axios.get(
      "https://sachet.ndma.gov.in/cap_public_website/FetchXMLFile?identifier=1741084967207009",
      { headers: { "Content-Type": "application/xml" } }
    );
    const xmlData = apiResponse.data;
    const jsonData = await parseStringPromise(xmlData);

    const alert = jsonData["cap:alert"];
    const info = alert["cap:info"][0];

    // Extract Data
    const identifier = alert["cap:identifier"][0];
    const sender = alert["cap:sender"][0];
    const sent = alert["cap:sent"][0];
    const event = info["cap:event"][0];
    const category = info["cap:category"][0];
    const urgency = info["cap:urgency"][0];
    const severity = info["cap:severity"][0];
    const certainty = info["cap:certainty"][0];
    const headline = info["cap:headline"][0];
    const description = info["cap:description"][0];
    const instruction = info["cap:instruction"][0];

    await pool.query(
      `INSERT INTO alerts (identifier, sender, sent, event, category, urgency, severity, certainty, headline, description, instruction)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (identifier) DO NOTHING`,
      [
        identifier,
        sender,
        sent,
        event,
        category,
        urgency,
        severity,
        certainty,
        headline,
        description,
        instruction,
      ]
    );
    res.json({ message: "Data Fetched , paresed and stored successfully ! " });
    console.log("stored");
  } catch (error) {
    console.error("Error :", error);
    res.status(500).json({ error: "Error fetching, parsing, or storing data" });
  }
};

export const getData = async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT * FROM alerts");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data" });
  }
};