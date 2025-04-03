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
        console.log(`[Scraper] Fetching data from: ${link} (Attemp ${retries + 1})`);
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
    console.log(`[Scraper] Initialing scrape for: ${rss_link}`);

    const scrapedData = await fetchData(rss_link);
    console.log(scrapedData)
    if(!scrapedData) {
        console.warn(`[Scraper] Failed to scrape data from: ${rss_link}`);
        return null;
    }

    // Extract necessary fields from the scraped XML data
    const alertInfo = scrapedData?.alert || {};
    console.log(alertInfo.info?.area?.polygon);
    return {
        identifier: alertInfo.identifier || null,
        sender: alertInfo.sender || null,
        scope: alertInfo.scope || null,
        urgency: alertInfo.info?.urgency || null,
        severity: alertInfo.info?.severity || null,
        certainty: alertInfo.info?.certainty || null,
        expires: alertInfo.info?.expires || null,
        affected_areas: alertInfo.info?.area?.areaDesc || null,
        instruction: alertInfo.info?.instruction || null,
        event: alertInfo.info?.event || null,
        headline: alertInfo.info?.headline || null,
        created_at: new Date().toISOString(),
        polygon: alertInfo.info?.area?.polygon || null,
    };
}