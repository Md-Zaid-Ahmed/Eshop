const bcrypt = require("bcrypt");
const { poolPromise, sql } = require("../../config/database");
const { jwtAuthMiddleWare } = require("../../utils/jwt");

exports.deleteCategory = [
  jwtAuthMiddleWare, // Middleware to ensure authentication

  async (req, res) => {
    const { categoryID } = req.params;

    // Validate required fields
    if (!categoryID) {
      return res.status(400).json({
        error: "Category ID is required.",
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
          error: "Unauthorized. Only admins can delete categories.",
        });
      }

      // Check if the category exists
      const checkCategoryQuery = `
        SELECT * FROM Category WHERE CategoryID = @CategoryID
      `;
      const categoryResult = await pool
        .request()
        .input("CategoryID", sql.Int, categoryID)
        .query(checkCategoryQuery);

      if (categoryResult.recordset.length === 0) {
        return res.status(404).json({
          error: "Category not found.",
        });
      }

      const categoryName = categoryResult.recordset[0].CategoryName;

      // Delete the category
      const deleteQuery = `
        DELETE FROM Category WHERE CategoryID = @CategoryID
      `;
      await pool
        .request()
        .input("CategoryID", sql.Int, categoryID)
        .query(deleteQuery);

      return res.status(200).json({
        CategoryName : categoryName,
        message: "Category deleted successfully.",
      });
    } catch (err) {
      console.error("Error deleting category:", err);
      return res.status(500).json({
        error: "An error occurred while deleting the category. Please try again later.",
      });
    }
  },
];
