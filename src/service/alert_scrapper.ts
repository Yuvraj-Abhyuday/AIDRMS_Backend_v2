import axios from "axios";
import xml2js from "xml2js";
import dotenv from "dotenv";

dotenv.config();

const MAX_RETRIES = 3;
const RETRY_DELAY = 3000;

/**
 * Fetch data from the provided RSS link with retries.
 */

async function fetchData(link: string, retries = 0): Promise<any> {
    try {
        console.log(`[Scraper] Fetching data from: ${link} (Attempt ${retries + 1})`);
        const response = await axios.get(link, { timeout: 3000 });
        const xmlData = response.data;

        const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true});
        const result = await parser.parseStringPromise(xmlData);

        return result;
    } catch (error: any) {
        console.error(`[Scraper] Error fetching data: ${error.message}`);

        if(retries < MAX_RETRIES) {
            console.log(`[Scraper] Retrying in ${RETRY_DELAY / 1000} seconds... (${retries + 1}/${MAX_RETRIES})`);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            return fetchData(link, retries + 1);
        }


        return null;
    }
}

/**
 * Scrape alert data from the RSS link.
 */
export async function scrapeAlert(rss_link: string) {
    console.log(`[Scraper] Initiating scrape for: ${rss_link}`);

    const scrapedData = await fetchData(rss_link);
    if (!scrapedData) {
        console.warn(`[Scraper] Failed to scrape data from: ${rss_link}`);
        return null;
    }

    try {
        const alertInfo = scrapedData["cap:alert"] || {};
        const info = Array.isArray(alertInfo["cap:info"])
            ? alertInfo["cap:info"][0]
            : alertInfo["cap:info"] || {};
        const area = Array.isArray(info["cap:area"])
            ? info["cap:area"][0]
            : info["cap:area"] || {};

        // Parse polygon into array of [lat, lon] pairs
        let polygon = null;
        const polygonString = area["cap:polygon"];
        if (polygonString && typeof polygonString === "string") {
            try {
                // Remove any surrounding quotes or braces if present
                const cleanString = polygonString.replace(/^"|{/, "").replace(/}"$/, "");
                // Split by space and convert to [lat, lon] pairs
                polygon = cleanString
                    .trim()
                    .split(" ")
                    .map((coordPair: string) => {
                        const [lat, lon] = coordPair.split(",").map(Number);
                        if (isNaN(lat) || isNaN(lon)) {
                            throw new Error(`Invalid coordinate pair: ${coordPair}`);
                        }
                        return [lat, lon];
                    });
            } catch (error:any) {
                console.error(`[Scraper] Failed to parse polygon: ${error.message}`);
                polygon = null;
            }
        }

        return {
            identifier: alertInfo["cap:identifier"] || null,
            sender: alertInfo["cap:sender"] || null,
            scope: alertInfo["cap:scope"] || null,
            urgency: info["cap:urgency"] || null,
            severity: info["cap:severity"] || null,
            certainty: info["cap:certainty"] || null,
            expires: info["cap:expires"] || null,
            affected_areas: area["cap:areaDesc"] || null,
            instruction: info["cap:instruction"] || null,
            event: info["cap:event"] || null,
            headline: info["cap:headline"] || null,
            created_at: alertInfo["cap:sent"] || null,
            polygon: polygon
        };
    } catch (error:any) {
        console.error(`[Scraper] Error processing scraped data: ${error.message}`);
        return null;
    }
}