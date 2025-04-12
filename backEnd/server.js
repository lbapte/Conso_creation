require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();

// Use environment variable, with a fallback
const secretKey = process.env.JWT_SECRET || "6729a6512d71731e04be69259feedd9ee3825b34f053a7dede6bd24960981e03";

app.use(bodyParser.json());
app.use(cors());

// Create a connection pool to the MySQL database using .env variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost", // Fallback to "localhost" if not in .env
  user: process.env.DB_USER || "lbapte1",
  password: process.env.DB_PASSWORD || "Fh<2Mfs;L@>V",
  database: process.env.DB_NAME || "conso_app",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.execute(
      'SELECT id, email, entreprise FROM conso_app.users',
      [username, password]
    );

    if (rows.length > 0) {
      const user = rows[0];
      const token = jwt.sign({ id: user.id, entreprise: user.entreprise }, secretKey, { expiresIn: '1h' });
      res.json({ token, entreprise: user.entreprise });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});