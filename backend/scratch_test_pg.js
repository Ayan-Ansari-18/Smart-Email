require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting:', err.message);
  } else {
    console.log('Connected successfully:', res.rows);
  }
  pool.end();
});
