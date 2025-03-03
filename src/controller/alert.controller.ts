// src/controller/alert.controller.ts
import { Request, Response } from "express";
import NDMAAlert from "../models/alert.model";
import axios from "axios";
import { parseStringPromise } from "xml2js";

export const getAlerts = async (req: Request, res: Response) => {
  try {
    // 1) Query the DB for all alerts that contain a link
    const storedAlerts = await NDMAAlert.find();

    // 2) For each alert, fetch and parse the CAP XML
    const enrichedAlerts = await Promise.all(
      storedAlerts.map(async (doc) => {
        try {
          // Fetch the CAP XML from the link
          const { data } = await axios.get(doc.link, { responseType: "text" });
          const parsedData = await parseStringPromise(data, {
            explicitArray: false,
          });

          // Extract fields from the parsed XML
          const capAlert = parsedData["cap:alert"];
          const info = capAlert["cap:info"];

          // Return a single object that merges
          // the doc fields + the CAP fields
          return {
            _id: doc._id,           
            title: doc.title,        
            link: doc.link,          
            description: doc.description, 
            pubDate: doc.pubDate,    

            // CAP fields
            identifier: capAlert["cap:identifier"],
            sender: capAlert["cap:sender"],
            sent: capAlert["cap:sent"],
            status: capAlert["cap:status"],
            msgType: capAlert["cap:msgType"],
            scope: capAlert["cap:scope"],
            event: info["cap:event"],
            urgency: info["cap:urgency"],
            severity: info["cap:severity"],
            certainty: info["cap:certainty"],
            effective: info["cap:effective"],
            expires: info["cap:expires"],
            headline: info["cap:headline"],
            instruction: info["cap:instruction"],
          };
        } catch (fetchError) {
          console.error(`Error fetching/parsing CAP from link: ${doc.link}`, fetchError);
          // Return a fallback object if fetching fails
          return {
            _id: doc._id,
            title: doc.title,
            link: doc.link,
            description: doc.description,
            pubDate: doc.pubDate,
            // Return blank or partial CAP fields
            identifier: "",
            sender: "",
            sent: "",
            status: "",
            msgType: "",
            scope: "",
            event: doc.title, // fallback to the doc's title if you want
            urgency: "",
            severity: "",
            certainty: "",
            effective: "",
            expires: "",
            headline: "",
            instruction: "",
          };
        }
      })
    );

    // 3) Respond with the enriched alerts
    res.json(enrichedAlerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};
