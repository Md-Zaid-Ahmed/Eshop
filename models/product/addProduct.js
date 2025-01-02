const { poolPromise, sql } = require("../../config/database");
const { jwtAuthMiddleWare } = require("../../utils/jwt");

exports.addProduct = [
  jwtAuthMiddleWare, // Middleware to ensure authentication

  async (req, res) => {
    const { CategoryID, ProductName, SellingCost, ProductMargin, MakingCost, ImageData } = req.body;

    // Validate required fields
    if (!CategoryID || !ProductName || !MakingCost) {
      return res.status(400).json({
        error: "Category ID, Product Name, and Making Cost are required.",
      });
    }

    // Business logic to calculate missing values
    let calculatedSellingCost = SellingCost;
    let calculatedProductMargin = ProductMargin;

    // If SellingCost is provided, calculate ProductMargin
    if (SellingCost && !ProductMargin) {
      if (SellingCost <= MakingCost) {
        return res.status(400).json({
          error: "Selling Cost must be greater than Making Cost.",
        });
      }
      calculatedProductMargin = SellingCost - MakingCost;
    }
    // If ProductMargin is provided, calculate SellingCost
    else if (ProductMargin && !SellingCost) {
      calculatedSellingCost = MakingCost + ProductMargin;
    }
    // If neither SellingCost nor ProductMargin is provided, return an error
    else if (!SellingCost && !ProductMargin) {
      return res.status(400).json({
        error: "Either Selling Cost or Product Margin must be provided.",
      });
    }

    try {
      const tokenData = req.user; // Extract user data from the token
      const adminID = tokenData.adminID;
      const adminUID = tokenData.uniqueId;

      const pool = await poolPromise;

      // Check if the user is an admin
      const checkAdminQuery = `
        SELECT * FROM Admins WHERE AdminID = @AdminID AND Uid = @Uid
      `;
      const checkAdminResult = await pool
        .request()
        .input("AdminID", sql.Int, adminID)
        .input("Uid", sql.NVarChar, adminUID)
        .query(checkAdminQuery);

      if (checkAdminResult.recordset.length === 0) {
        return res.status(403).json({
          error: "Unauthorized. Only admins can add products.",
        });
      }

      // Check if the product name already exists in the database
      const checkProductQuery = `
        SELECT * FROM Product WHERE ProductName = @ProductName
      `;
      const checkProductResult = await pool
        .request()
        .input("ProductName", sql.VarChar, ProductName)
        .query(checkProductQuery);

      if (checkProductResult.recordset.length > 0) {
        return res.status(400).json({
          error: "Product name already exists. Please choose a different name.",
        });
      }

      // Add the product to the database
      const insertQuery = `
        INSERT INTO Product (CategoryID, AdminID, ProductName, ProductMargin, SellingCost, MakingCost, ImageData)
        VALUES (@CategoryID, @AdminID, @ProductName, @ProductMargin, @SellingCost, @MakingCost, @ImageData);
      `;
      
      await pool
        .request()
        .input("CategoryID", sql.Int, CategoryID)
        .input("AdminID", sql.Int, adminID)
        .input("ProductName", sql.VarChar, ProductName)
        .input("ProductMargin", sql.Decimal(10, 2), calculatedProductMargin)
        .input("SellingCost", sql.Decimal(10, 2), calculatedSellingCost)
        .input("MakingCost", sql.Decimal(10, 2), MakingCost)
        .input("ImageData", sql.NVarChar, ImageData || null) // Image data is optional
        .query(insertQuery);

      return res.status(201).json({
        message: "Product added successfully.",
        product: {
          ProductName,
          CategoryID,
          SellingCost: calculatedSellingCost,
          ProductMargin: calculatedProductMargin,
          MakingCost,
          ImageData
        }
      });
    } catch (err) {
      console.error("Error adding product:", err);
      return res.status(500).json({
        error: "An error occurred while adding the product. Please try again later.",
      });
    }
  },
];
