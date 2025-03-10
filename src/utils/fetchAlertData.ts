import axios from "axios";
import { parseStringPromise } from "xml2js";

const ALERT_URL =
  "https://sachet.ndma.gov.in/cap_public_website/FetchXMLFile?identifier=1741095333405006";

export const fetchAndParseXML = async () => {
  try {
    const apiResponse = await axios.get(ALERT_URL, {
      headers: { "Content-Type": "application/xml" },
    });

    const jsonData = await parseStringPromise(apiResponse.data);
    const alert = jsonData["cap:alert"];
    const info = alert["cap:info"][0];

    return {
      identifier: alert["cap:identifier"][0],
      sender: alert["cap:sender"][0],
      sent: alert["cap:sent"][0],
      status: alert["cap:status"][0],
      msgType: alert["cap:msgType"][0],
      scope: alert["cap:scope"][0],
      event: info["cap:event"][0],
      category: info["cap:category"][0],
      urgency: info["cap:urgency"][0],
      severity: info["cap:severity"][0],
      certainty: info["cap:certainty"][0],
      headline: info["cap:headline"][0],
      description: info["cap:description"][0],
      instruction: info["cap:instruction"][0],
    };
  } catch (error) {
    throw new Error("Error fetching or parsing XML data");
  }
};
