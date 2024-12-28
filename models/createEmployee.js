const bcrypt = require("bcrypt");
const { poolPromise, sql } = require("../config/database");
const { jwtAuthMiddleWare } = require("../utils/jwt");
const ShortUniqueId = require('short-unique-id');

exports.createEmployee = [
  jwtAuthMiddleWare, // Middleware to ensure authentication

  async (req, res) => {
    const { name, username, password, email, imagedata, phonenumber } = req.body;

    // Validate required fields
    if (!name || !username || !password || !email || !phonenumber) {
      return res.status(400).json({
        error: "Name, username, password, email, and unique ID are required.",
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
          error: "Unauthorized. Only admins can create employees.",
        });
      }

      // Check if the Username or Email already exists in the Employee table
      const checkEmployeeQuery = `
        SELECT COUNT(*) AS count 
        FROM Employee 
        WHERE Username = @Username OR Email = @Email
      `;
      const checkEmployeeResult = await pool
        .request()
        .input("Username", sql.NVarChar, username)
        .input("Email", sql.NVarChar, email)
        .query(checkEmployeeQuery);

      if (checkEmployeeResult.recordset[0].count > 0) {
        return res.status(400).json({
          error: "Username or Email already exists.",
        });
      }

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
      const uid = new ShortUniqueId();
      let uniqueId = uid(6);

      // Insert the new employee into the Employee table
      const insertQuery = `
        INSERT INTO Employee (Name, Username, Password, Email, CreatedAt, Uid, ImageData, PhoneNumber)
        VALUES (@Name, @Username, @Password, @Email, DEFAULT, @Uid, @ImageData, @PhoneNumber);
        SELECT SCOPE_IDENTITY() AS EmployeeID; 
      `;
      const result = await pool
        .request()
        .input("Name", sql.NVarChar, name)
        .input("Username", sql.NVarChar, username)
        .input("Password", sql.NVarChar, hashedPassword)
        .input("Email", sql.NVarChar, email)
        .input("Uid", sql.NVarChar, uniqueId)
        .input("ImageData", sql.NVarChar, imagedata || null)
        .input("PhoneNumber", sql.NVarChar, phonenumber) // Optional field
        .query(insertQuery);

      const newEmployeeID = result.recordset[0].EmployeeID;

      // Construct the response with the new employee data
      const response = {
        employeeID: newEmployeeID,
        name: name,
        username: username,
        email: email,
        createdAt: new Date().toISOString(),
        uid: uniqueId,
        createdBy: {
          adminID,
        },
      };

      return res.status(200).json({
        message: "Employee created successfully.",
        employee: response,
      });
    } catch (err) {
      console.error("Error creating employee:", err);
      return res.status(500).json({
        error: "An error occurred while creating the employee. Please try again later.",
      });
    }
  },
  
];

//updateEmployee

exports.updateEmployee = [
  jwtAuthMiddleWare, // Middleware to ensure authentication

  async (req, res) => {
    const { employeeID, name, username, email, imagedata, phonenumber } = req.body;

    // Validate required fields
    if (!employeeID || !name || !username || !email || !phonenumber) {
      return res.status(400).json({
        error: "Employee ID, name, username, email, and phone number are required.",
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
          error: "Unauthorized. Only admins can update employees.",
        });
      }

      // Check if the Employee exists
      const checkEmployeeQuery = `
        SELECT * FROM Employee WHERE EmployeeID = @EmployeeID
      `;
      const employeeResult = await pool
        .request()
        .input("EmployeeID", sql.Int, employeeID)
        .query(checkEmployeeQuery);

      if (employeeResult.recordset.length === 0) {
        return res.status(404).json({
          error: "Employee not found.",
        });
      }

      // Update employee information
      const updateQuery = `
        UPDATE Employee
        SET Name = @Name, Username = @Username, Email = @Email, 
            ImageData = @ImageData, PhoneNumber = @PhoneNumber
        WHERE EmployeeID = @EmployeeID
      `;
      await pool
        .request()
        .input("Name", sql.NVarChar, name)
        .input("Username", sql.NVarChar, username)
        .input("Email", sql.NVarChar, email)
        .input("ImageData", sql.NVarChar, imagedata || null)
        .input("PhoneNumber", sql.NVarChar, phonenumber)
        .input("EmployeeID", sql.Int, employeeID)
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
