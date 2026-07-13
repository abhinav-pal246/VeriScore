const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./db");
const axios = require("axios");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Get all flagged transactions
app.get("/api/transactions", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM transactions 
       WHERE status = 'pending' 
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Score a new transaction
app.post("/api/transactions/score", async (req, res) => {
  const txn = req.body;
  try {
    // Call Python ML service
    const mlResponse = await axios.post(
      `${process.env.ML_SERVICE_URL}/score`,
      txn
    );
    const { risk_score, fraud_pattern, analyst_explanation, customer_explanation } =
      mlResponse.data;

    // Persist to PostgreSQL
    const result = await pool.query(
      `INSERT INTO transactions 
        (transaction_id, timestamp, sender_account, receiver_account,
         amount, channel, sender_city, device_id, merchant_category,
         risk_score, fraud_pattern, analyst_explanation, customer_explanation, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pending')
       RETURNING *`,
      [
        txn.transaction_id,
        txn.timestamp,
        txn.sender_account,
        txn.receiver_account,
        txn.amount,
        txn.channel,
        txn.sender_city,
        txn.device_id,
        txn.merchant_category,
        risk_score,
        fraud_pattern,
        analyst_explanation,
        customer_explanation,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Scoring failed" });
  }
});

// Analyst decision — approve or block
app.post("/api/decisions", async (req, res) => {
  const { transaction_id, action } = req.body;
  try {
    // Record the decision
    await pool.query(
      `INSERT INTO decisions (transaction_id, action) VALUES ($1, $2)`,
      [transaction_id, action]
    );

    // Update transaction status
    await pool.query(
      `UPDATE transactions SET status = $1 WHERE transaction_id = $2`,
      [action, transaction_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Decision failed" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`VeriScore server running on port ${PORT}`);
});