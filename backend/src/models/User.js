const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create({ username, email, password, role = 'user' }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const result = await pool.query(
      `INSERT INTO users (username, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, username, email, role, balance, created_at`,
      [username, email, hashedPassword, role]
    );
    
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, username, email, role, balance, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async updateBalance(userId, amount, operation = 'add') {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const operator = operation === 'add' ? '+' : '-';
      const result = await client.query(
        `UPDATE users 
         SET balance = balance ${operator} $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING id, balance`,
        [amount, userId]
      );

      if (result.rows[0].balance < 0) {
        throw new Error('Insufficient balance');
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAll(limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT id, username, email, role, balance, is_active, created_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }
}

module.exports = User;
