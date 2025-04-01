import axios from "axios";
import xml2js from "xml2js";
import dotenv from "dotenv";

dotenv.config();

const RSS_URL = "https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml";
const BASE_URL = process.env.API_URL || "http://localhost:3000"; // Your API endpoint
const API_URL = `${BASE_URL}/api/rss`;

console.log(`[Scrapper] Base URL: ${BASE_URL}`);
console.log(`[Scrapper] Full API URL: ${API_URL}`);

interface Alert {
  time: string;
  headline: string;
  link: string;
}

const MAX_RETRIES = 3;

/**
 * Fetch RSS Feed and Extract Alerts
 */
async function fetchRSSFeed(retries = 0): Promise<Alert[]> {
  try {
    console.log(`[Scrapper] Fetching RSS feed from: ${RSS_URL} (Attempt ${retries + 1})`);
    const response = await axios.get(RSS_URL, { timeout: 10000 });
    const rssXml = response.data;

    const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
    const result = await parser.parseStringPromise(rssXml);

    const items = result?.rss?.channel?.item || [];
    if (!Array.isArray(items)) {
      console.warn("[Scrapper] Unexpected RSS structure: No valid items found.");
      return [];
    }

    // Extract the required fields
    const alerts: Alert[] = items.map((item: { pubDate?: string; title?: string; link?: string }) => ({
      time: item.pubDate || "Unknown Time",
      headline: item.title || "No Headline Available",
      link: item.link || "No Link Available"
    }));

    console.log(`[Scrapper] Extracted ${alerts.length} alerts.`);
    return alerts;
  } catch (error: any) {
    console.error(`[Scrapper] Error fetching RSS feed: ${error.message}`);

    if (retries < MAX_RETRIES) {
      console.log(`[Scrapper] Retrying... (${retries + 1}/${MAX_RETRIES})`);
      return fetchRSSFeed(retries + 1);
    }

    return [];
  }
}

/**
 * Store Alerts in Database via API
 */
async function storeAlerts(alerts: Alert[]): Promise<void> {
  console.log(`[Scrapper] Attempting to store ${alerts.length} alerts`);
  
  for (const alert of alerts) {
    try {
      console.log(`[Scrapper] Storing alert: ${alert.headline}`);
      const response = await axios.post(API_URL, alert);
      console.log(`[Scrapper] ✅ Alert stored successfully: ${alert.headline}`);
      console.log(`[Scrapper] API Response:`, response.data);
    } catch (error: any) {
      if (error.response?.status === 409) {
        console.warn(`[Scrapper] ⚠️ Alert already exists: ${alert.headline}`);
      } else {
        console.error(`[Scrapper] ❌ Failed to store alert: ${alert.headline}`, error.message);
        
        // Additional error logging
        if (error.response) {
          console.error('[Scrapper] Error response data:', error.response.data);
          console.error('[Scrapper] Error response status:', error.response.status);
          console.error('[Scrapper] Error response headers:', error.response.headers);
        }
      }
    }
  }
}

/**
 * Scrape RSS and Store in DB
 */
export async function scrapeRSSFeed(): Promise<void> {
  console.log("[Scrapper] Starting RSS Feed Scraping Process");
  
  const alerts = await fetchRSSFeed();
  
  if (alerts.length > 0) {
    await storeAlerts(alerts);
    console.log(`[Scrapper] Completed storing ${alerts.length} alerts`);
  } else {
    console.warn("[Scrapper] No alerts to store.");
  }
}
