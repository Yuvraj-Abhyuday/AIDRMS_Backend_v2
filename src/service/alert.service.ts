import pool from "../models/postgresAlert.model";
import { AlertData } from "../interface/alert.interface";

export const storeAlertintoDB = async (alertData: AlertData) => {
  const columns = Object.keys(alertData).join(", ");
  // "identifier, sender, sent, event, category, urgency, severity, certainty, headline, description, instruction"

  const values = Object.values(alertData);
  // [
  //   "12345",
  //   "NDMA",
  //   "2025-03-05T12:00:00Z",
  //   "Flood Warning",
  //   "Meteorological",
  //   "Immediate",
  //   "Severe",
  //   "Likely",
  //   "Severe Flooding Expected",
  //   "Heavy rainfall will cause severe flooding in the region.",
  //   "Evacuate to higher ground immediately."
  // ]
  
  // Step 2: Generate placeholders for query values
  const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
  // "$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11"

  const query = `
  INSERT INTO alerts (${columns}) 
  VALUES (${placeholders}) 
  ON CONFLICT (identifier) DO NOTHING
`;

  await pool.query(query, values);
};

export const getDatafromDD = async () => {
  const result = await pool.query("Select  * from alerts");
  return result.rows;
};
