const { poolPromise, sql } = require("../../config/database");
const { jwtAuthMiddleWare } = require("../../utils/jwt");

exports.getCategory = [
  jwtAuthMiddleWare, // Middleware to ensure authentication

  async (req, res) => {
    const { id, name } = req.body; // Accept CategoryID or CategoryName via query parameters

    // Validate required fields
    if (!id && !name) {
      return res.status(400).json({
        error: "Category ID or Category Name is required.",
      });
    }

    try {
      const pool = await poolPromise;

      // Query to fetch the category
      const getQuery = id
        ? `
          SELECT CategoryID, AdminID, CategoryName, CreatedAt, UpdatedAt
          FROM Category
          WHERE CategoryID = @CategoryID
        `
        : `
          SELECT CategoryID, AdminID, CategoryName, CreatedAt, UpdatedAt
          FROM Category
          WHERE CategoryName = @CategoryName
        `;

      const result = await pool
        .request()
        .input("CategoryID", sql.Int, id || null)
        .input("CategoryName", sql.NVarChar, name || null)
        .query(getQuery);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          error: "Category not found.",
        });
      }

      return res.status(200).json({
        message: "Category fetched successfully.",
        category: result.recordset[0],
      });
    } catch (err) {
      console.error("Error fetching category:", err);
      return res.status(500).json({
        error: "An error occurred while fetching the category. Please try again later.",
      });
    }
  },
];
