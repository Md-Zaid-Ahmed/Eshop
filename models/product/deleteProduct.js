const { poolPromise, sql } = require("../../config/database");
const { jwtAuthMiddleWare } = require("../../utils/jwt");

exports.deleteProduct = [
  jwtAuthMiddleWare, // Middleware to ensure authentication

  async (req, res) => {
    const { id } = req.params;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        error: "Product ID is required.",
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
          error: "Unauthorized. Only admins can delete a product.",
        });
      }

      // Check if the product exists
      const getQuery = `
        SELECT ProductID, ProductName 
        FROM Product 
        WHERE ProductID = @ProductID
      `;
      const result = await pool
        .request()
        .input("ProductID", sql.Int, id)
        .query(getQuery);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          error: "Product not found.",
        });
      }

      const productName = result.recordset[0].ProductName;

      // Delete the product
      const deleteQuery = `
        DELETE FROM Product WHERE ProductID = @ProductID
      `;
      await pool
        .request()
        .input("ProductID", sql.Int, id)
        .query(deleteQuery);

      return res.status(200).json({
        ProductName: productName,
        message: "Product deleted successfully.",
      });
    } catch (err) {
      console.error("Error deleting product:", err);
      return res.status(500).json({
        error: "An error occurred while deleting the product. Please try again later.",
      });
    }
  },
];