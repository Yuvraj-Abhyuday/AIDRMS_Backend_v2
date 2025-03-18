import { pool } from "../config/database";

export const createSOS = async (user_id: string, sos_location: string, sos_event: string, sos_description?: string) => {
    const sos_query = `INSERT INTO sos (user_id, sos_location, sos_time, sos_event, sos_description) VALUES ($1, $2, NOW(), $3, $4) RETURNING *`;
    return await pool.query(sos_query, [user_id, sos_location, sos_event, sos_description || null]);
};
