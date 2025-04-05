import axios from "axios";
import xml2js from "xml2js";
import dotenv from "dotenv";

dotenv.config();

const MAX_RETRIES = 3;
const RETRY_DELAY = 3000;
const REQUEST_TIMEOUT = 10000; // Increased to 10 seconds for larger responses

/**
 * Fetch data from the provided RSS link with retries.
 */
async function fetchData(link: string, retries = 0): Promise<any> {
  try {
    console.log(
      `[Scraper] Fetching data from: ${link} (Attempt ${
        retries + 1
      }/${MAX_RETRIES})`
    );
    const response = await axios.get(link, {
      timeout: REQUEST_TIMEOUT,
      maxContentLength: Infinity, // Allow large responses
      maxBodyLength: Infinity,
      responseType: "text", // Ensure full text response
    });
    const xmlData = response.data;

    const parser = new xml2js.Parser({
      explicitArray: false, // Single child nodes as objects, not arrays
      mergeAttrs: true,
    });
    const result = await parser.parseStringPromise(xmlData);
    console.log(`[Scraper] Successfully parsed XML from: ${link}`);
    return result;
  } catch (error: any) {
    console.error(`[Scraper] Error fetching data: ${error.message}`);

    if (retries < MAX_RETRIES - 1) {
      // -1 to log final failure separately
      console.log(
        `[Scraper] Retrying in ${RETRY_DELAY / 1000} seconds... (${
          retries + 1
        }/${MAX_RETRIES})`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return fetchData(link, retries + 1);
    }

    console.error(`[Scraper] Exhausted retries for: ${link}`);
    return null;
  }
}

/**
 * Scrape alert data from the RSS link, handling multiple polygons.
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

    // Handle multiple polygons
    const polygonsRaw = Array.isArray(area["cap:polygon"])
      ? area["cap:polygon"]
      : [area["cap:polygon"]].filter(Boolean); // Ensure non-empty array
    // console.log(polygonsRaw);

    const polygons = polygonsRaw
      .map((polygonString: string, index: number) => {
        if (!polygonString || typeof polygonString !== "string") {
          console.warn(`[Scraper] Polygon ${index} is invalid or missing`);
          return null;
        }
        try {
          const cleanString = polygonString.trim();
          console.log(
            `[Scraper] Parsing polygon ${index} with length: ${cleanString.length}`
          );
          const coords = cleanString
            .split(" ")
            .map((coordPair: string, coordIndex: number) => {
              const [lat, lon] = coordPair.split(",").map(Number);
              if (isNaN(lat) || isNaN(lon)) {
                throw new Error(
                  `Invalid coordinate pair at index ${coordIndex}: ${coordPair}`
                );
              }
              return [lat, lon];
            });

          // Check if polygon is closed (optional validation)
          const firstCoord = coords[0];
          const lastCoord = coords[coords.length - 1];
          if (
            firstCoord[0] !== lastCoord[0] ||
            firstCoord[1] !== lastCoord[1]
          ) {
            console.warn(`[Scraper] Polygon ${index} is not closed`);
          }

          return coords;
        } catch (error: any) {
          console.error(
            `[Scraper] Failed to parse polygon ${index}: ${error.message}`
          );
          return null;
        }
      })
      .filter(Boolean); // Remove failed parses

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
      polygons: polygons.length > 0 ? polygons : null, // Array of polygon arrays
    };
  } catch (error: any) {
    console.error(`[Scraper] Error processing scraped data: ${error.message}`);
    return null;
  }
}
