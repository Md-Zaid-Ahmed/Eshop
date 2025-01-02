const { poolPromise, sql } = require("../../config/database");
const { jwtAuthMiddleWare } = require("../../utils/jwt");

exports.getProducts = [
  jwtAuthMiddleWare, // Middleware to ensure authentication

  async (req, res) => {
    try {
      const pool = await poolPromise;

      // Fetch all Products
      const getQuery = `
         SELECT ProductID, CategoryID, AdminID, ProductName, ProductMargin, SellingCost, MakingCost, CreatedAt, UpdatedAt, ImageData 
         from Product 
         
      `;
      const result = await pool.request().query(getQuery);

      return res.status(200).json({
        message: "Product fetched successfully.",
        Products: result.recordset,
      });
    } catch (err) {
      console.error("Error fetching Product :", err);
      return res.status(500).json({
        error: "An error occurred while fetching the Product. Please try again later.",
      });
    }
  },
];
