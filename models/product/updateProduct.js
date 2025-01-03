const { poolPromise, sql } = require("../../config/database");
const { jwtAuthMiddleWare } = require("../../utils/jwt");

exports.updateProduct = [
  jwtAuthMiddleWare, // Middleware to ensure authentication

  async (req, res) => {
    const { productID } = req.params;
    const { productName, sellingCost, productMargin, makingCost, imageData, categoryID } = req.body;

    if (!productID) {
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
          error: "Unauthorized. Only admins can update products.",
        });
      }

      // Check if the product exists
      const checkProductQuery = `
        SELECT * FROM Product WHERE ProductID = @ProductID
      `;
      const productResult = await pool
        .request()
        .input("ProductID", sql.Int, productID)
        .query(checkProductQuery);

      if (productResult.recordset.length === 0) {
        return res.status(404).json({
          error: "Product not found.",
        });
      }

      const existingProduct = productResult.recordset[0];

      // If a new category ID is provided, verify that the category exists
      if (categoryID && categoryID !== existingProduct.CategoryID) {
        const checkCategoryQuery = `
          SELECT * FROM Category WHERE CategoryID = @CategoryID
        `;
        const categoryResult = await pool
          .request()
          .input("CategoryID", sql.Int, categoryID)
          .query(checkCategoryQuery);

        if (categoryResult.recordset.length === 0) {
          return res.status(400).json({
            error: "The specified category does not exist.",
          });
        }
      }

      // Update the product
      const updateProductQuery = `
        UPDATE Product
        SET 
          ProductName = CASE WHEN @ProductName IS NOT NULL THEN @ProductName ELSE ProductName END,
          SellingCost = CASE WHEN @SellingCost IS NOT NULL THEN @SellingCost ELSE SellingCost END,
          ProductMargin = CASE WHEN @ProductMargin IS NOT NULL THEN @ProductMargin ELSE ProductMargin END,
          MakingCost = CASE WHEN @MakingCost IS NOT NULL THEN @MakingCost ELSE MakingCost END,
          ImageData = CASE WHEN @ImageData IS NOT NULL THEN @ImageData ELSE ImageData END,
          CategoryID = CASE WHEN @CategoryID IS NOT NULL THEN @CategoryID ELSE CategoryID END,
          UpdatedAt = GETDATE()
        WHERE ProductID = @ProductID
      `;
      await pool
        .request()
        .input("ProductName", sql.VarChar, productName || null)
        .input("SellingCost", sql.Decimal(10, 2), sellingCost || null)
        .input("ProductMargin", sql.Decimal(10, 2), productMargin || null)
        .input("MakingCost", sql.Decimal(10, 2), makingCost || null)
        .input("ImageData", sql.NVarChar, imageData || null)
        .input("CategoryID", sql.Int, categoryID || null)
        .input("ProductID", sql.Int, productID)
        .query(updateProductQuery);

      return res.status(200).json({
        previousCategory: existingProduct.CategoryID,
        updatedCategory: categoryID || existingProduct.CategoryID,
        previousName: existingProduct.ProductName,
        updatedName: productName || existingProduct.ProductName,
        message: "Product updated successfully.",
      });
    } catch (err) {
      console.error("Error updating product:", err);
      return res.status(500).json({
        error: "An error occurred while updating the product. Please try again later.",
      });
    }
  },
];
