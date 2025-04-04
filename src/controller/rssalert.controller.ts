import { Request, Response } from "express";
import { scrapeAlert } from "../service/alert_scrapper";
import { checkExistingAlert, saveNewAlert } from "../models/rssalert.model";

export const handleScraperRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { rss_id, rss_link } = req.body;
        if (!rss_id || !rss_link) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }

        const existingData = await checkExistingAlert(rss_id, rss_link);
        if (existingData) {
            res.json({ message: "Data fetched from database", data: existingData });
            return;
        }

        const scrapedData = await scrapeAlert(rss_link);
        if (!scrapedData) {
            res.status(500).json({ message: "Failed to scrape data" });
            return;
        }

        const savedData = await saveNewAlert(rss_id, rss_link, scrapedData);
        res.json({ message: "Data scraped and saved", data: savedData });
    } catch (error) {
        console.error("Error handling scraper request: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};