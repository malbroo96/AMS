const { v4: uuidv4 } = require('uuid');
const { sql, getPool } = require('../config/database');

const NotificationModel = {
  async create({ userId, title, message }) {
    const id = uuidv4();
    const pool = await getPool();
    await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('user_id', sql.UniqueIdentifier, userId)
      .input('title', sql.NVarChar(200), title)
      .input('message', sql.NVarChar(sql.MAX), message)
      .query(`
        INSERT INTO Notifications (id, user_id, title, message)
        VALUES (@id, @user_id, @title, @message)
      `);
    return this.findById(id);
  },

  async findById(id) {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .query('SELECT * FROM Notifications WHERE id = @id');
    return result.recordset[0] || null;
  },

  async listByUser(userId, { unreadOnly = false } = {}) {
    const pool = await getPool();
    let query = 'SELECT * FROM Notifications WHERE user_id = @user_id';
    if (unreadOnly) query += ' AND is_read = 0';
    query += ' ORDER BY created_at DESC';
    const result = await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query(query);
    return result.recordset;
  },

  async markRead(id, userId) {
    const pool = await getPool();
    await pool
      .request()
      .input('id', sql.UniqueIdentifier, id)
      .input('user_id', sql.UniqueIdentifier, userId)
      .query('UPDATE Notifications SET is_read = 1 WHERE id = @id AND user_id = @user_id');
    return this.findById(id);
  },

  async markAllRead(userId) {
    const pool = await getPool();
    await pool
      .request()
      .input('user_id', sql.UniqueIdentifier, userId)
      .query('UPDATE Notifications SET is_read = 1 WHERE user_id = @user_id');
  },
};

module.exports = NotificationModel;
