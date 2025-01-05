const { poolPromise, sql } = require("../../config/database");
const { jwtAuthMiddleWare } = require("../../utils/jwt");

exports.getEmployees = [
  jwtAuthMiddleWare, // Middleware to ensure authentication

  async (req, res) => {

    try {
      const pool = await poolPromise;

      // Query to fetch the employee based on `id` or `username`
      const getQuery  =
        `
         SELECT EmployeeID, Name, Username, Password, Email, CreatedAt, Uid, ImageData, PhoneNumber, Address 
         FROM Employee
        `
    const result = await pool.request().query(getQuery);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          error: "Employees not found.",
        });
      }

      return res.status(200).json(
        result.recordset,
      );
    } catch (err) {
      console.error("Error fetching employees:", err);
      return res.status(500).json({
        error: "An error occurred while fetching the employees. Please try again later.",
      });
    }
  },
];