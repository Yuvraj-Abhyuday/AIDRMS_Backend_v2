import { pool } from "../config/database";

export const checkExistingAlert = async (rss_id: string, rss_link: string) => {
    try {
        const query = "SELECT * FROM rssalert WHERE rss_id = $1 AND rss_link = $2";
        const { rows } = await pool.query(query, [rss_id, rss_link]);
        return rows.length ? rows[0] : null;
    } catch (error) {
        console.error("Error checking existing alert:", error);
        throw new Error("Database error while checking existing alert.");
    }
};

export const saveNewAlert = async (rss_id: string, rss_link: string, data: any) => {
    try {
        const query = `
            INSERT INTO rssalert 
            (rss_id, rss_link, identifier, sender, scope, urgency, severity, 
             certainty, expires, affected_areas, instruction, event, headline, 
             created_at, polygons) 
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
             COALESCE($14, NOW()), $15) 
            RETURNING *`;
        
        const polygonsJson = data.polygons ? JSON.stringify(data.polygons) : null;
        const values = [
            rss_id, rss_link, data.identifier, data.sender, data.scope, 
            data.urgency, data.severity, data.certainty, data.expires, 
            data.affected_areas, data.instruction, data.event, data.headline, 
            data.created_at || null, polygonsJson
        ];
        
        console.log("[Save] Polygons to save:", polygonsJson); // Debug
        const { rows } = await pool.query(query, values);
        return rows[0];
    } catch (error) {
        console.error("Error saving new alert:", error);
        throw new Error("Database error while saving new alert.");
    }
};