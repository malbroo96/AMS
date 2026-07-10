const { getPool, sql } = require("../config/database");

const NotificationModel = {
  async create(data) {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("collegeId", sql.Int, data.collegeId)
      .input("type", sql.NVarChar(50), data.type)
      .input("title", sql.NVarChar(200), data.title)
      .input("description", sql.NVarChar(sql.MAX), data.description)
      .input("priority", sql.NVarChar(20), data.priority)
      .input("referenceId", sql.Int, data.referenceId || null)
      .input("referenceType", sql.NVarChar(50), data.referenceType || null)
      .query(`
        INSERT INTO Notifications
        (
            CollegeId,
            Type,
            Title,
            Description,
            Priority,
            ReferenceId,
            ReferenceType
        )
        OUTPUT INSERTED.*
        VALUES
        (
            @collegeId,
            @type,
            @title,
            @description,
            @priority,
            @referenceId,
            @referenceType
        )
      `);

    return result.recordset[0];
  },

  async findByCollege(collegeId) {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("collegeId", sql.Int, collegeId)
      .query(`
        SELECT *
        FROM Notifications
        WHERE CollegeId = @collegeId
        ORDER BY CreatedAt DESC
      `);

    return result.recordset;
  },

  async findById(notificationId) {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("notificationId", sql.Int, notificationId)
      .query(`
        SELECT *
        FROM Notifications
        WHERE Id = @notificationId
      `);

    return result.recordset[0] || null;
  },

  async markAsRead(notificationId) {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("notificationId", sql.Int, notificationId)
      .query(`
        UPDATE Notifications
        SET IsRead = 1
        OUTPUT INSERTED.*
        WHERE Id = @notificationId
      `);

    return result.recordset[0];
  },

  async markAllAsRead(collegeId) {
    const pool = await getPool();

    await pool
      .request()
      .input("collegeId", sql.Int, collegeId)
      .query(`
        UPDATE Notifications
        SET IsRead = 1
        WHERE CollegeId = @collegeId
      `);

    return true;
  },
};

module.exports = NotificationModel;