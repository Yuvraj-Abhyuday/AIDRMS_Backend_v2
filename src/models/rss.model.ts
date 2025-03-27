import { pool } from "../config/database";

export const insertAlert = async (time: string, headline: string, link: string) => {
    const query = 'INSERT INTO rssfeed (rss_time, rss_headline, rss_link) VALUES ($1, $2, $3)';
    return await pool.query(query, [time, headline, link]);
};

export const checkAlertExists = async (link: string) => {
    const query = 'SELECT * FROM rssfeed WHERE rss_link = $1';
    return await pool.query(query, [link]);
};

export const getAlerts = async () => {
    const query = 'SELECT * FROM rssfeed ORDER BY rss_time DESC';
    return await pool.query(query);
};
