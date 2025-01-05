const { poolPromise, sql } = require("../../config/database");
const { jwtAuthMiddleWare } = require("../../utils/jwt");

exports.getEmployee = [
  jwtAuthMiddleWare, // Middleware to ensure authentication

  async (req, res) => {
    const { id, username } = req.query; // Accept `id` and `username` as query parameters

    // Validate required fields
    if (!id && !username) {
      return res.status(400).json({
        error: "Employee ID or Employee username is required.",
      });
    }

    try {
      const pool = await poolPromise;

      // Query to fetch the employee based on `id` or `username`
      const getQuery = id
        ? `
         SELECT EmployeeID, Name, Username, Password, Email, CreatedAt, Uid, ImageData, PhoneNumber, Address 
         FROM Employee
         WHERE EmployeeID = @EmployeeID
        `
        : `
         SELECT EmployeeID, Name, Username, Password, Email, CreatedAt, Uid, ImageData, PhoneNumber, Address 
         FROM Employee
         WHERE Username = @Username
        `;

      const result = await pool
        .request()
        .input("EmployeeID", sql.Int, id || null)
        .input("Username", sql.VarChar, username || null)
        .query(getQuery);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          error: "Employee not found.",
        });
      }

      return res.status(200).json({
        message: "Employee fetched successfully.",
        employee: result.recordset[0],
      });
    } catch (err) {
      console.error("Error fetching employee:", err);
      return res.status(500).json({
        error: "An error occurred while fetching the employee. Please try again later.",
      });
    }
  },
];