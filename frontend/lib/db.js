/**
 * Database connection helper.
 *
 * HOW IT WORKS:
 * - We create a "pool" of connections to PostgreSQL.
 *   A pool keeps several connections open so each request
 *   doesn't need to connect/disconnect every time (much faster).
 *
 * - The `query` function is the one you'll use everywhere.
 *   Example:
 *     const { rows } = await query('SELECT * FROM users WHERE id = $1', [userId]);
 *
 *   $1, $2, $3... are "parameterized" placeholders — they prevent SQL injection.
 */

import pg from 'pg';
const { Pool } = pg;

// Create a pool using the DATABASE_URL from .env.local
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

/**
 * Run a SQL query.
 * @param {string} text  - the SQL string (use $1, $2... for parameters)
 * @param {Array}  params - values for the placeholders
 * @returns {Promise<{rows: Array, rowCount: number}>}
 */
export async function query(text, params) {
    const result = await pool.query(text, params);
    return result;
}

export default pool;
