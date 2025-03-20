import { pool } from "../config/database";

export const createUser = async (
  name: string,
  number: string,
  email: string,
  designation: string,
  department: string,
  position: string,
  password: string
): Promise<number> => {
  const insert_query = `
    INSERT INTO users (name, number, email, designation, department, position, password)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING user_id;  -- Adjust to 'id' if your column is named 'id'
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
  return result.rows[0].user_id; // Return the generated user_id
};

// No changes needed for checkUserExists
export const checkUserExists = async (number: string) => {
  const check_query = "SELECT * FROM users WHERE number = $1";
  return await pool.query(check_query, [number]);
};