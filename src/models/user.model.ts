import { pool } from "../config/database";

export const createUser = async (name: string, number: string, email: string, designation: string, password: string) => {
    const insert_query = 'INSERT INTO users (name, number, email, designation, password) VALUES ($1, $2, $3, $4, $5)';
    return await pool.query(insert_query, [name, number, email, designation, password]);
};

export const checkUserExists = async (number: string) => {
    const check_query = 'SELECT * FROM users WHERE number = $1';
    return await pool.query(check_query, [number]);
};

export const findUserByEmail = async (number: string) => {
    const query = 'SELECT * FROM users WHERE number = $1';
    return await pool.query(query, [number]);
};
