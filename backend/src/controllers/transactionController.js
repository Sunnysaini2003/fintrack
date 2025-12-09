const pool = require("../config/db");

// Add new transaction
const createTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      category_id,
      type,
      amount,
      description,
      txn_date,
      payment_method,
    } = req.body;

    if (!type || !amount || !txn_date) {
      return res
        .status(400)
        .json({ message: "type, amount and txn_date are required" });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({ message: "Invalid transaction type" });
    }

    const [result] = await pool.query(
      `INSERT INTO transactions 
        (user_id, category_id, type, amount, description, txn_date, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        category_id || null,
        type,
        amount,
        description || null,
        txn_date,
        payment_method || "other",
      ]
    );

    res.status(201).json({
      message: "Transaction created",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Create transaction error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Get list of transactions with optional filters
const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { from, to, type, category_id } = req.query;

    let query = "SELECT * FROM transactions WHERE user_id = ?";
    const params = [userId];

    if (type && ["income", "expense"].includes(type)) {
      query += " AND type = ?";
      params.push(type);
    }

    if (category_id) {
      query += " AND category_id = ?";
      params.push(category_id);
    }

    if (from) {
      query += " AND txn_date >= ?";
      params.push(from);
    }

    if (to) {
      query += " AND txn_date <= ?";
      params.push(to);
    }

    query += " ORDER BY txn_date DESC, created_at DESC";

    const [rows] = await pool.query(query, params);

    res.json({ transactions: rows });
  } catch (err) {
    console.error("Get transactions error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a transaction
const updateTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const txnId = req.params.id;
    const {
      category_id,
      type,
      amount,
      description,
      txn_date,
      payment_method,
    } = req.body;

    // Ensure the transaction belongs to this user
    const [existingRows] = await pool.query(
      "SELECT id FROM transactions WHERE id = ? AND user_id = ?",
      [txnId, userId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    await pool.query(
      `UPDATE transactions
         SET category_id = ?, type = ?, amount = ?, description = ?, 
             txn_date = ?, payment_method = ?
       WHERE id = ? AND user_id = ?`,
      [
        category_id || null,
        type,
        amount,
        description || null,
        txn_date,
        payment_method || "other",
        txnId,
        userId,
      ]
    );

    res.json({ message: "Transaction updated" });
  } catch (err) {
    console.error("Update transaction error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a transaction
const deleteTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const txnId = req.params.id;

    const [result] = await pool.query(
      "DELETE FROM transactions WHERE id = ? AND user_id = ?",
      [txnId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted" });
  } catch (err) {
    console.error("Delete transaction error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
};
