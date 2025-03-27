import { Request, Response } from "express";
import { insertAlert, checkAlertExists, getAlerts } from "../models/rss.model";

export const postAlert = async (req: Request, res: Response): Promise<void> => {
    try {
        const { time, headline, link } = req.body;

        if (!time || !headline || !link) {
            res.status(400).json({ error: "Missing required fields: time, headline, and link" });
            return;
        }

        const existingAlert = await checkAlertExists(link);
        if (existingAlert.rows.length > 0) {
            res.status(409).json({ message: "Alert already exists" });
            return;
        }

        await insertAlert(time, headline, link);
        res.status(201).json({ message: "Alert saved successfully" });

    } catch (error) {
        console.error("Error posting alert:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getAllAlerts = async (_req: Request, res: Response): Promise<void> => {
    try {
        const alerts = await getAlerts();

        if (alerts.rows.length === 0) {
            res.status(404).json({ message: "No alerts found" });
            return;
        }

        res.status(200).json(alerts.rows);

    } catch (error) {
        console.error("Error fetching alerts:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};