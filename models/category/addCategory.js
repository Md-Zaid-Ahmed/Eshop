const bcrypt = require("bcrypt");
const { poolPromise, sql } = require("../../config/database");
const { jwtAuthMiddleWare } = require("../../utils/jwt");

exports.addCategory = [
  jwtAuthMiddleWare, // Middleware to ensure authentication

  async (req, res) => {
    const { name } = req.params;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        error: "Category name is required.",
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
          error: "Unauthorized. Only admins can add categories.",
        });
      }

      // Check if the category name already exists
      const checkCategoryQuery = `
        SELECT COUNT(*) AS count 
        FROM Category 
        WHERE CategoryName = @CategoryName
      `;
      const checkCategoryResult = await pool
        .request()
        .input("CategoryName", sql.NVarChar, name)
        .query(checkCategoryQuery);

      if (checkCategoryResult.recordset[0].count > 0) {
        return res.status(400).json({
          error: "Category name already exists.",
        });
      }

      // Insert the new category into the Category table
      const insertQuery = `
        INSERT INTO Category (AdminID, CategoryName, CreatedAt, UpdatedAt)
        VALUES (@AdminID, @CategoryName, DEFAULT, DEFAULT);
        SELECT SCOPE_IDENTITY() AS CategoryID;
      `;
      const result = await pool
        .request()
        .input("AdminID", sql.Int, adminID)
        .input("CategoryName", sql.NVarChar, name)
        .query(insertQuery);

      const newCategoryID = result.recordset[0].CategoryID;

      // Construct the response with the new category data
      return res.status(200).json({
        message: "Category added successfully.",
        category: {
          categoryID: newCategoryID,
          name,
          createdBy: adminID,
        },
      });
    } catch (err) {
      console.error("Error adding category:", err);
      return res.status(500).json({
        error: "An error occurred while adding the category. Please try again later.",
      });
    }
  },
];
