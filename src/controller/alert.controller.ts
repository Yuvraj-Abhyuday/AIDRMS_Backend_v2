import { Request, Response } from "express";
import axios from "axios";
import { parseStringPromise } from "xml2js";

const CAP_API_URL =
  "https://sachet.ndma.gov.in/cap_public_website/FetchXMLFile?identifier=1740562481896014";

export const fetchAlerts = async (req: Request, res: Response) => {
  try {
    // Fetch CAP XML data
    const { data } = await axios.get(CAP_API_URL, { responseType: "text" });

    // Convert XML to JSON
    const parsedData = await parseStringPromise(data, { explicitArray: false });

    // Extract relevant details
    const alert = parsedData["cap:alert"];
    const info = alert["cap:info"];

    const structuredAlert = {
      identifier: alert["cap:identifier"],
      sender: alert["cap:sender"],
      sent: alert["cap:sent"],
      status: alert["cap:status"],
      msgType: alert["cap:msgType"],
      scope: alert["cap:scope"],
      event: info["cap:event"],
      urgency: info["cap:urgency"],
      severity: info["cap:severity"],
      certainty: info["cap:certainty"],
      effective: info["cap:effective"],
      expires: info["cap:expires"],
      headline: info["cap:headline"],
      instruction: info["cap:instruction"]
    };

    res.json(structuredAlert); // Send structured alert JSON to frontend
  } catch (error) {
    console.error("Error fetching CAP data:", error);
    res.status(500).json({ error: "Failed to fetch CAP alert data" });
  }
};
