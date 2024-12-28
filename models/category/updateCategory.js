const { poolPromise, sql } = require("../../config/database");
const { jwtAuthMiddleWare } = require("../../utils/jwt");

exports.updateCategory = [
  jwtAuthMiddleWare, // Middleware to ensure authentication

  async (req, res) => {
    const { categoryID,name } = req.params;

    // Validate required fields
    if (!categoryID || !name) {
      return res.status(400).json({
        error: "Category ID and new name are required.",
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
          error: "Unauthorized. Only admins can update categories.",
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

      // Check if the new name already exists in the database
      const duplicateCheckQuery = `
        SELECT COUNT(*) AS count
        FROM Category
        WHERE CategoryName = @CategoryName AND CategoryID != @CategoryID
      `;
      const duplicateCheckResult = await pool
        .request()
        .input("CategoryName", sql.NVarChar, name)
        .input("CategoryID", sql.Int, categoryID)
        .query(duplicateCheckQuery);

      if (duplicateCheckResult.recordset[0].count > 0) {
        return res.status(400).json({
          error: "Category name already exists. Please choose a different name.",
        });
      }

      // Update the category
      const updateQuery = `
        UPDATE Category
        SET CategoryName = @CategoryName, UpdatedAt = GETDATE()
        WHERE CategoryID = @CategoryID
      `;
      await pool
        .request()
        .input("CategoryName", sql.NVarChar, name)
        .input("CategoryID", sql.Int, categoryID)
        .query(updateQuery);

      return res.status(200).json({
        previousName: categoryName,
        updatedName: name,
        message: "Category updated successfully.",
      });
    } catch (err) {
      console.error("Error updating category:", err);
      return res.status(500).json({
        error: "An error occurred while updating the category. Please try again later.",
      });
    }
  },
];
