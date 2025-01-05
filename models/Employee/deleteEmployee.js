const { poolPromise, sql } = require("../../config/database");
const { jwtAuthMiddleWare } = require("../../utils/jwt");

exports.deleteEmployee = [
  jwtAuthMiddleWare, // Middleware to ensure authentication

  async (req, res) => {
    const { id } = req.params;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        error: "Employee ID is required.",
      });
    }

    try {
      const tokenData = req.user; // Extract user data from the token
      const adminID = tokenData.adminID;
      const adminUID = tokenData.uniqueId;

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
          error: "Unauthorized. Only admins can delete an employee.",
        });
      }

      // Check if the employee exists
      const getQuery = `
        SELECT EmployeeID, Name 
        FROM Employee 
        WHERE EmployeeID = @EmployeeID
      `;
      const result = await pool
        .request()
        .input("EmployeeID", sql.Int, id)
        .query(getQuery);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          error: "Employee not found.",
        });
      }

      const employeeName = result.recordset[0].Name;

      // Delete the employee
      const deleteQuery = `
        DELETE FROM Employee WHERE EmployeeID = @EmployeeID
      `;
      await pool
        .request()
        .input("EmployeeID", sql.Int, id)
        .query(deleteQuery);

      return res.status(200).json({
        EmployeeName: employeeName,
        message: "Employee deleted successfully.",
      });
    } catch (err) {
      console.error("Error deleting employee:", err);
      return res.status(500).json({
        error: "An error occurred while deleting the employee. Please try again later.",
      });
    }
  },
];
