import { Request, Response } from "express";
import { checkExistingAlert, saveNewAlert } from "../models/rssalert.model";
import { scrapeAlert } from "../service/alert_scrapper";

export const handleScraperRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { rss_id, rss_link } = req.body;
        if (!rss_id || !rss_link) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }

        const existingData = await checkExistingAlert(rss_id, rss_link);
        if (existingData) {
            console.log("Raw polygons from DB:", existingData.polygons, typeof existingData.polygons); // For debugging
            res.json({
                message: "Data fetched from database",
                data: existingData // polygons is already an array, no JSON.parse needed
            });
            return;
        }

        const scrapedData = await scrapeAlert(rss_link);
        if (!scrapedData) {
            res.status(500).json({ message: "Failed to scrape data" });
            return;
        }

        const savedData = await saveNewAlert(rss_id, rss_link, scrapedData);
        res.json({
            message: "Data scraped and saved",
            data: savedData // polygons is already an array
        });
    } catch (error) {
        console.error("Error handling scraper request: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
};