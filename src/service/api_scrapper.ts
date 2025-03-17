import axios from "axios";
import xml2js from "xml2js";
import pool from "../models/postgresAlert.model";
import { AlertData } from "../interface/alert.interface";

const RSSURL = process.env.RSSURL || "https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml";

interface RSSItem {
  title: string;
  description?: string;
  category?: string;
  link: string;
  author?: string;
  guid: { _: string; isPermaLink: string };
  pubDate: string;
}

async function fetchWithRetry(url: string, retries = 3, delay = 2000): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, { timeout: 10000 });
    } catch (error) {
      if (i === retries - 1) {
        console.error(`Failed to fetch ${url} after ${retries} retries:`, (error as Error).message);
        throw error;
      }
      console.log(`Retrying ${url} (${i + 1}/${retries})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function scrapeRSSFeed(url: string = RSSURL): Promise<AlertData[]> {
  try {
    console.log(`Fetching RSS feed from: ${url}`);
    const rssResponse = await fetchWithRetry(url);
    const rssXml = rssResponse.data;

    const rssParser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
    const rssResult = await rssParser.parseStringPromise(rssXml);

    const items = rssResult.rss?.channel?.item || [];
    if (!items.length) {
      console.log("No items found in RSS feed");
      return [];
    }

    const parsedAlerts: AlertData[] = [];
    const capParser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false, mergeAttrs: false }); // Adjusted options

    for (let i = 0; i < items.length; i += 2) {
      const batch = items.slice(i, i + 2);
      const batchPromises = batch.map(async (item: RSSItem) => {
        const capUrl = item.link;
        const identifier = item.guid?._ || "N/A";
        const sender = item.author?.match(/\((.+)\)/)?.[1] || "Unknown";

        try {
          const capResponse = await fetchWithRetry(capUrl);
          const capXml = capResponse.data;
          const capResult = await capParser.parseStringPromise(capXml);

          console.log(`CAP XML for ${identifier}:`, capXml); // Debug raw XML
          console.log(`Parsed CAP result for ${identifier}:`, JSON.stringify(capResult, null, 2)); // Debug parsed result

          const alert = capResult["cap:alert"] || {};
          const infoArray = Array.isArray(alert["cap:info"]) ? alert["cap:info"] : [alert["cap:info"] || {}];
          const info = infoArray.find(i => i["cap:language"] === "en-IN") || infoArray[0] || {};

          console.log(`Info object for ${identifier}:`, JSON.stringify(info, null, 2)); // Debug info object

          return {
            identifier: alert["cap:identifier"] || identifier,
            sender: alert["cap:sender"] || sender,
            scope: alert["cap:scope"] || "Public",
            urgency: info["cap:urgency"] || "Unknown",
            severity: info["cap:severity"] || "Unknown",
            certainty: info["cap:certainty"] || "Unknown",
            expires: info["cap:expires"] || "N/A",
            affected_area:
              info["cap:area"]?.["cap:areaDesc"] ||
              item.title.match(/over\s+(.+?)(?:\sin\snext|\sduring\snext|$)/)?.[1] ||
              "Unknown",
            instruction: info["cap:instruction"] || "No instruction",
            event: info["cap:event"] || "No event",
            headline: info["cap:headline"] || item.title,
          };
        } catch (capError) {
          console.error(`Error fetching/parsing CAP XML for ${capUrl}:`, (capError as Error).message);
          return {
            identifier,
            sender,
            scope: "Public",
            urgency: "Unknown",
            severity: "Unknown",
            certainty: "Unknown",
            expires: "N/A",
            affected_area:
              item.title.match(/over\s+(.+?)(?:\sin\snext|\sduring\snext|$)/)?.[1] || "Unknown",
            instruction: "No instruction",
            event: item.title.match(/^(.*?)(?:\sis\svery|with\smedium|with\shigh)/)?.[1]?.trim() || "No event",
            headline: item.title,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      parsedAlerts.push(...batchResults);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[${new Date().toISOString()}] Parsed ${parsedAlerts.length} alerts`);
    await saveAlertToDB(parsedAlerts);
    return parsedAlerts;
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error fetching RSS feed:`, (err as Error).message);
    throw err;
  }
}

// ... (saveAlertToDB function remains unchanged)
async function saveAlertToDB(alerts: AlertData[]) {
  if (alerts.length === 0) {
    console.log(`[${new Date().toISOString()}] No new alerts to save`);
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Step 1: Get existing identifiers from the database
    const identifiers = alerts.map(alert => alert.identifier);
    const existingQuery = `
      SELECT identifier FROM alerts WHERE identifier = ANY($1);
    `;
    const existingResult = await client.query(existingQuery, [identifiers]);
    const existingIdentifiers = new Set(existingResult.rows.map(row => row.identifier));

    // Step 2: Filter out alerts that already exist
    const newAlerts = alerts.filter(alert => !existingIdentifiers.has(alert.identifier));
    console.log(`[${new Date().toISOString()}] Found ${newAlerts.length} new alerts out of ${alerts.length} parsed`);

    if (newAlerts.length === 0) {
      console.log(`[${new Date().toISOString()}] All alerts already exist in the database`);
      await client.query("COMMIT");
      return;
    }

    // Step 3: Insert only new alerts
    const values = newAlerts.flatMap(alert => [
      alert.identifier,
      alert.sender,
      alert.scope,
      alert.urgency,
      alert.severity,
      alert.certainty,
      alert.expires === "N/A" ? null : alert.expires,
      alert.affected_area,
      alert.instruction,
      alert.event,
      alert.headline,
    ]);
    const placeholders = newAlerts
      .map((_, i) =>
        `($${i * 11 + 1}, $${i * 11 + 2}, $${i * 11 + 3}, $${i * 11 + 4}, $${i * 11 + 5}, $${i * 11 + 6}, $${i * 11 + 7}, $${i * 11 + 8}, $${i * 11 + 9}, $${i * 11 + 10}, $${i * 11 + 11})`
      )
      .join(", ");
    const insertQuery = `
      INSERT INTO alerts (identifier, sender, scope, urgency, severity, certainty, expires, affected_area, instruction, event, headline)
      VALUES ${placeholders}
      ON CONFLICT (identifier) DO NOTHING;
    `;

    await client.query(insertQuery, values);
    await client.query("COMMIT");
    console.log(`[${new Date().toISOString()}] Successfully saved ${newAlerts.length} new alert(s) to the database`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`[${new Date().toISOString()}] Error saving alerts to DB:`, (error as Error).message);
    throw error;
  } finally {
    client.release();
  }
}