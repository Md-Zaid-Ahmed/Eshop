const { poolPromise, sql } = require("../../config/database");
const { jwtAuthMiddleWare } = require("../../utils/jwt");

exports.updateEmployee = [
  jwtAuthMiddleWare, // Middleware to ensure authentication

  async (req, res) => {
    const { id } = req.params;
    const { name, username, email, phoneNumber, address, imageData } = req.body;

    // Validate required fields
    if (!id) {
      return res.status(400).json({
        error: "Employee ID is required.",
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
          error: "Unauthorized. Only admins can update employees.",
        });
      }

      // Check if the employee exists
      const getQuery = `
        SELECT * FROM Employee WHERE EmployeeID = @EmployeeID
      `;
      const result = await pool
        .request()
        .input("EmployeeID", sql.Int, id)
        .query(getQuery);

      if (result.recordset.length === 0) {
        return res.status(404).json({
          error: "Employee not found.",
        });
      }

      const existingEmployee = result.recordset[0];

      // If no changes are made, return a 201 status
      if (
        (name && name === existingEmployee.Name) &&
        (username && username === existingEmployee.Username) &&
        (email && email === existingEmployee.Email) &&
        (phoneNumber && phoneNumber === existingEmployee.PhoneNumber) &&
        (address && address === existingEmployee.Address) &&
        (imageData && imageData === existingEmployee.ImageData) &&
        (name !== "" && username !== "" && email !== "" && phoneNumber !== "" && address !== "" && imageData !== "")
      ) {
        return res.status(201).json({
          message: "No changes made to the employee.",
        });
      }

      // Check if the new username already exists in the database
      if (username && username !== existingEmployee.Username) {
        const duplicateCheckQuery = `
          SELECT COUNT(*) AS count
          FROM Employee
          WHERE Username = @Username AND EmployeeID != @EmployeeID
        `;
        const duplicateCheckResult = await pool
          .request()
          .input("Username", sql.VarChar, username)
          .input("EmployeeID", sql.Int, id)
          .query(duplicateCheckQuery);

        if (duplicateCheckResult.recordset[0].count > 0) {
          return res.status(400).json({
            error: "Username already exists. Please choose a different username.",
          });
        }
      }

      // Update the employee
      const updateQuery = `
        UPDATE Employee
        SET 
          Name = CASE WHEN @Name IS NOT NULL AND @Name != '' THEN @Name ELSE Name END,
          Username = CASE WHEN @Username IS NOT NULL AND @Username != '' THEN @Username ELSE Username END,
          Email = CASE WHEN @Email IS NOT NULL AND @Email != '' THEN @Email ELSE Email END,
          PhoneNumber = CASE WHEN @PhoneNumber IS NOT NULL AND @PhoneNumber != '' THEN @PhoneNumber ELSE PhoneNumber END,
          Address = CASE WHEN @Address IS NOT NULL AND @Address != '' THEN @Address ELSE Address END,
          ImageData = CASE WHEN @ImageData IS NOT NULL AND @ImageData != '' THEN @ImageData ELSE ImageData END
        WHERE EmployeeID = @EmployeeID
      `;
      await pool
        .request()
        .input("Name", sql.VarChar(100), name || null) // Matches VARCHAR(100)
        .input("Username", sql.VarChar(50), username || null) // Matches VARCHAR(50)
        .input("Email", sql.NVarChar(255), email || null) // Matches NVARCHAR(255)
        .input("PhoneNumber", sql.VarChar(15), phoneNumber || null) // Assuming 15 as a practical limit for phone numbers
        .input("Address", sql.NVarChar(255), address || null) // Assuming NVARCHAR(255) as a sensible length for addresses
        .input("ImageData", sql.NVarChar(sql.MAX), imageData || null) // Matches NVARCHAR(MAX)
        .input("EmployeeID", sql.Int, id)
        .query(updateQuery);

      return res.status(200).json({
        message: "Employee updated successfully.",
      });
    } catch (err) {
      console.error("Error updating employee:", err);
      return res.status(500).json({
        error: "An error occurred while updating the employee. Please try again later.",
      });
    }
  },
];
