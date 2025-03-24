require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');
const app = express();
const secretKey ="6729a6512d71731e04be69259feedd9ee3825b34f053a7dede6bd24960981e03";

app.use(bodyParser.json());
app.use(cors());

// Create a connection pool to the MySQL database
const pool = mysql.createPool({
  host: "localhost",
  user: "lbapte1",
  password: "Fh<2Mfs;L@>V",
  database: "conso_app",
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

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});