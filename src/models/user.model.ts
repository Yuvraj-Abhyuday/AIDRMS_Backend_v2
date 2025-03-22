import { pool } from "../config/database";

export const createUser = async (
  name: string,
  number: string,
  email: string,
  designation: string,
  department: string,
  position: string,
  password: string
): Promise<{ user_id: number; designation: string }> => {
  const insert_query = `
    INSERT INTO users (name, number, email, designation, department, position, password)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING user_id, designation;  -- Return both user_id and designation
  `;
  const result = await pool.query(insert_query, [
    name,
    number,
    email,
    designation,
    department,
    position,
    password,
  ]);
  return {
    user_id: result.rows[0].user_id,
    designation: result.rows[0].designation,
  }; // Return an object with both values
};

export const checkUserExists = async (number: string) => {
  const check_query = "SELECT * FROM users WHERE number = $1";
  return await pool.query(check_query, [number]);
};