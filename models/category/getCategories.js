const { poolPromise, sql } = require("../../config/database");
const { jwtAuthMiddleWare } = require("../../utils/jwt");

exports.getCategories = [
  jwtAuthMiddleWare, // Middleware to ensure authentication

  async (req, res) => {
    try {
      const pool = await poolPromise;

      // Fetch all categories
      const getQuery = `
        SELECT CategoryID, AdminID, CategoryName, CreatedAt, UpdatedAt
        FROM Category
        ORDER BY CreatedAt DESC
      `;
      const result = await pool.request().query(getQuery);

      return res.status(200).json({
        message: "Categories fetched successfully.",
        categories: result.recordset,
      });
    } catch (err) {
      console.error("Error fetching categories:", err);
      return res.status(500).json({
        error: "An error occurred while fetching the categories. Please try again later.",
      });
    }
  },
];
