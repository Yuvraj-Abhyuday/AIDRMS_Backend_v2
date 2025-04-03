import  { pool } from "../config/database";

export const checkExistingAlert = async(rss_id: string, rss_link: string ) => {
    const query = "SELECT * FROM rssalert WHERE rss_id = $1 AND rss_link = $2";
    const { rows } = await pool.query(query, [rss_id, rss_link]);
    return rows.length ? rows[0] : null;
};

export const saveNewAlert = async (rss_id: string, rss_link: string, data: any) => {
    const query = `INSERT INTO rssalert (rss_id, rss_link, identifier, sender, scope, urgency, severity, certainty, expires, affected_areas, instruction, event, headline, created_at, polygon) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`;
    const values = [rss_id, rss_link, data.identifier, data.sender, data.scope, data.urgency, data.severity, data.certainty, data.expires, data.affected_areas, data.instruction, data.event, data.headline, data.created_at, data.polygon];
    const { rows } = await pool.query(query, values);
    return rows[0];
};