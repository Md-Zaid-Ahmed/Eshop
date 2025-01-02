const { poolPromise, sql } = require("../../config/database");
const { jwtAuthMiddleWare } = require("../../utils/jwt");

exports.getProduct = [
  jwtAuthMiddleWare, // Middleware to ensure authentication

  async (req, res) => {
    const { id, name } = req.body; // Accept productId or productName via query parameters

    // Validate required fields
    if (!id && !name) {
      return res.status(400).json({
        error: "Product ID or Product Name is required.",
      });
    }

    try {
      const pool = await poolPromise;

      // Query to fetch the category
      const getQuery = id
        ? `
         SELECT ProductID, CategoryID, AdminID, ProductName, ProductMargin, SellingCost, MakingCost, CreatedAt, UpdatedAt, ImageData 
         from Product 
         where ProductID = @ProductID
        `
        : `
          SELECT ProductID, CategoryID, AdminID, ProductName, ProductMargin, SellingCost, MakingCost, CreatedAt, UpdatedAt, ImageData 
         from Product 
         where ProductName = @ProductName
        `;

      const result = await pool
        .request()
        .input("ProductID", sql.Int, id || null)
        .input("ProductName", sql.VarChar, name || null)
        .query(getQuery);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          error: "Product not found.",
        });
      }

      return res.status(200).json({
        message: "Product fetched successfully.",
        product: result.recordset[0],
      });
    } catch (err) {
      console.error("Error fetching Product:", err);
      return res.status(500).json({
        error: "An error occurred while fetching the Product. Please try again later.",
      });
    }
  },
];