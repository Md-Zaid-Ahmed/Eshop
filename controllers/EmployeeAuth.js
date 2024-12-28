const bcrypt = require("bcrypt");
const { poolPromise, sql } = require("../config/database");
const { generateToken } = require("../utils/jwt");
const ShortUniqueId = require('short-unique-id');

// Login Functionality
exports.EmployeeLogin = async (req, res) => {
  const { identifier, password } = req.body;

  // Validate required fields
  if (!identifier || !password) {
    return res.status(400).json({
      error: "Username/Email and password are required.",
    });
  }

  try {
    const pool = await poolPromise;

    // Query to find user based on Username or Email
    const checkUserQuery = `
      SELECT EmployeeID, Name, Username, Email, Password, Uid 
      FROM Employee
      WHERE Username = @Identifier OR Email = @Identifier
    `;
    const result = await pool
      .request()
      .input("Identifier", sql.NVarChar, identifier)
      .query(checkUserQuery);

    // If no user is found
    if (result.recordset.length === 0) {
      return res.status(401).json({
        error: "Invalid username/email or password.",
      });
    }

    const user = result.recordset[0];
    console.log("User data:", JSON.stringify(user));

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.Password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid username/email or password.",
      });
    }

    // Prepare the token payload
    const tokenPayload = {
      employeeID: user.EmployeeID,
      name: user.Name,
      username: user.Username,
      email: user.Email,
      uniqueId: user.Uid,
    };

    // Generate JWT token
    const token = generateToken(tokenPayload);

    // Prepare the response
    const response = {
      message: "Login successful.",
      user: {
        employeeID: user.EmployeeID,
        name: user.Name,
        username: user.Username,
        email: user.Email,
      },
      token,
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error logging in:", err);
    return res.status(500).json({
      error: "Error logging in. Please try again later.",
      details: err.message,
    });
  }
};
