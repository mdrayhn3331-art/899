const pool = require('../config/database');

class Transaction {
  static async create({ userId, type, amount, paymentMethod, details = {} }) {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, amount, payment_method, details) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userId, type, amount, paymentMethod, JSON.stringify(details)]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status, transactionId = null) {
    const result = await pool.query(
      `UPDATE transactions 
       SET status = $1, transaction_id = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING *`,
      [status, transactionId, id]
    );
    return result.rows[0];
  }

  static async getUserTransactions(userId, limit = 20) {
    const result = await pool.query(
      `SELECT * FROM transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  static async getPendingTransactions() {
    const result = await pool.query(
      `SELECT t.*, u.username, u.email 
       FROM transactions t 
       JOIN users u ON t.user_id = u.id 
       WHERE t.status = 'pending' 
       ORDER BY t.created_at ASC`
    );
    return result.rows;
  }

  static async approveTransaction(id, adminId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const txn = await this.findById(id);
      
      if (!txn || txn.status !== 'pending') {
        throw new Error('Invalid transaction');
      }

      // Update user balance
      if (txn.type === 'deposit') {
        await client.query(
          'UPDATE users SET balance = balance + $1 WHERE id = $2',
          [txn.amount, txn.user_id]
        );
      }

      // Update transaction status
      await client.query(
        `UPDATE transactions 
         SET status = 'approved', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [id]
      );

      await client.query('COMMIT');
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Transaction;
