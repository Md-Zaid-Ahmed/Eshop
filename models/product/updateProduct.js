const { poolPromise, sql } = require("../../config/database");
const { jwtAuthMiddleWare } = require("../../utils/jwt");

exports.updateProduct = [
  jwtAuthMiddleWare, // Middleware to ensure authentication

  async (req, res) => {
    const { productID } = req.params;
    const { productName, sellingCost, productMargin, makingCost, imageData } = req.body;

    // Validate required fields
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

      // If no changes are made, return a 201 status
      if (
        (productName && productName === existingProduct.ProductName) &&
        (sellingCost && sellingCost === existingProduct.SellingCost) &&
        (productMargin && productMargin === existingProduct.ProductMargin) &&
        (makingCost && makingCost === existingProduct.MakingCost) &&
        (imageData && imageData === existingProduct.ImageData)
      ) {
        return res.status(201).json({
          message: "No changes made to the product.",
        });
      }

      // Check if the new product name already exists in the database
      if (productName && productName !== existingProduct.ProductName) {
        const duplicateCheckQuery = `
          SELECT COUNT(*) AS count
          FROM Product
          WHERE ProductName = @ProductName AND ProductID != @ProductID
        `;
        const duplicateCheckResult = await pool
          .request()
          .input("ProductName", sql.VarChar, productName)
          .input("ProductID", sql.Int, productID)
          .query(duplicateCheckQuery);

        if (duplicateCheckResult.recordset[0].count > 0) {
          return res.status(400).json({
            error: "Product name already exists. Please choose a different name.",
          });
        }
      }

      // Update the product
      const updateProductQuery = `
        UPDATE Product
        SET 
          ProductName = ISNULL(@ProductName, ProductName),
          SellingCost = ISNULL(@SellingCost, SellingCost),
          ProductMargin = ISNULL(@ProductMargin, ProductMargin),
          MakingCost = ISNULL(@MakingCost, MakingCost),
          ImageData = ISNULL(@ImageData, ImageData),
          UpdatedAt = GETDATE()
        WHERE ProductID = @ProductID
      `;
      await pool
        .request()
        .input("ProductName", sql.VarChar, productName || null)
        .input("SellingCost", sql.Decimal, sellingCost || null)
        .input("ProductMargin", sql.Decimal, productMargin || null)
        .input("MakingCost", sql.Decimal, makingCost || null)
        .input("ImageData", sql.NVarChar, imageData || null)
        .input("ProductID", sql.Int, productID)
        .query(updateProductQuery);

      return res.status(200).json({
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
