import { Request, Response } from "express";
import { fetchAndParseXML } from "../utils/fetchAlertData";
import { storeAlertintoDB, getDatafromDD } from "../service/alert.service";

export const fetchDataAndStore = async (req: Request, res: Response) => {
  try {
    const alertData = await fetchAndParseXML();
    await storeAlertintoDB(alertData);
    res.json({ message: "Data fetched, parsed, and stored successfully!" });
    console.log("Stored successfully!");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error fetching, parsing, or storing data" });
  }
};

export const getData = async (req: Request, res: Response) => {
  try {
    const alerts = await getDatafromDD();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data" });
  }
};
