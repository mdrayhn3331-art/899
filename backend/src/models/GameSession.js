const pool = require('../config/database');

class GameSession {
  static async create({ userId, gameType, betAmount, payout, result, serverSeed, clientSeed, nonce }) {
    const res = await pool.query(
      `INSERT INTO game_sessions 
       (user_id, game_type, bet_amount, payout, result, server_seed, client_seed, nonce) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [userId, gameType, betAmount, payout, JSON.stringify(result), serverSeed, clientSeed, nonce]
    );
    return res.rows[0];
  }

  static async getUserHistory(userId, limit = 20) {
    const result = await pool.query(
      `SELECT * FROM game_sessions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  static async getStats(userId) {
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_games,
         SUM(bet_amount) as total_wagered,
         SUM(payout) as total_won,
         SUM(payout - bet_amount) as net_profit
       FROM game_sessions 
       WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }
}

module.exports = GameSession;
