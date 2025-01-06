const bcrypt = require("bcrypt");
const { poolPromise, sql } = require("../../config/database");
const { jwtAuthMiddleWare } = require("../../utils/jwt");

exports.addService = [
  jwtAuthMiddleWare, // Middleware to ensure authentication

  async (req, res) => {
    const { name } = req.params;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        error: "Service name is required.",
      });
    }

    try {
      const tokenData = req.user; // Extract user data from the token
      console.log("Authenticated Admin Data: ", tokenData);

      const adminID = tokenData.adminID;
      const adminUID = tokenData.uniqueId; // Ensure this matches how your JWT is structured
      const pool = await poolPromise;

      // Verify that the requesting user is an admin
      const checkAdminQuery = `
        SELECT * FROM Admins WHERE AdminID = @AdminID AND Uid = @Uid
      `;
      const checkResult = await pool
        .request()
        .input("AdminID", sql.Int, adminID)
        .input("Uid", sql.NVarChar, adminUID)
        .query(checkAdminQuery);

      if (checkResult.recordset.length === 0) {
        return res.status(403).json({
          error: "Unauthorized. Only admins can add services.",
        });
      }

      // Check if the Service name already exists
      const checkServiceQuery = `
        SELECT COUNT(*) AS count 
        FROM OrderServices 
        WHERE ServiceName = @ServiceName
      `;
      const checkServiceResult = await pool
        .request()
        .input("ServiceName", sql.NVarChar, name)
        .query(checkServiceQuery);

      if (checkServiceResult.recordset[0].count > 0) {
        return res.status(400).json({
          error: "Service name already exists.",
        });
      }
      // Insert the new Service into the OrderService table
      const insertQuery = `
        INSERT INTO OrderServices ( ServiceName, AdminID, CreatedAt, IsActive)
        VALUES ( @ServiceName, @AdminID, DEFAULT, DEFAULT);
        SELECT SCOPE_IDENTITY() AS ServiceID;
      `;
      const result = await pool
        .request()
        .input("ServiceName", sql.NVarChar, name)
        .input("AdminID", sql.Int, adminID)
        .query(insertQuery);

      const newServiceID = result.recordset[0].ServiceID;

      // Construct the response with the new Service data
      return res.status(200).json({
        message: "Service created successfully.",
        Service: {
          ServiceID: newServiceID,
          ServiceName : name,
          createdBy: adminID,
        },
      });
    } catch (err) {
      console.error("Error adding Service:", err);
      return res.status(500).json({
        error: "An error occurred while adding the Service. Please try again later.",
      });
    }
  },
];