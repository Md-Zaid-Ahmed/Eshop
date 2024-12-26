const bcrypt = require("bcrypt");
const { poolPromise, sql } = require("../config/database");
const { generateToken } = require("../utils/jwt");
const ShortUniqueId = require('short-unique-id');

exports.signup = async (req, res) => {
  const { name, username, password, email, secret } = req.body;
  
  // Validate required fields
  if (!name || !username || !password || !email) {
    const response = {
      error: "Name, username, password name are required.",
    };
    return res.status(400).json(response);
  }

  // Check if secret is correct
  if (secret !== process.env.ADMIN_KEY) {
    const response = {
      error: "Invalid secret. You are not authorized to sign up.",
    };
    return res.status(403).json(response);
  }

  try {
    // Hash the password and secret
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedSecret = await bcrypt.hash(secret, 2);
    const pool = await poolPromise;
    const uid = new ShortUniqueId();
    let uniqueId = "HjjEFa";

    // Check if email or username already exists
    const checkUserQuery = `
      SELECT COUNT(*) AS count 
      FROM Admins 
      WHERE Username = @Username
    `;
    const checkResult = await pool
      .request()
      .input("Username", sql.NVarChar, username)
      .query(checkUserQuery);

    if (checkResult.recordset[0].count > 0) {
      const response = {
        error: "Username already exists.",
      };
      return res.status(400).json(response);
    }
    // After successful insertion of the admin user:
        const insertQuery = `
        INSERT INTO Admins (Name, Username, Password,Email, Secret, Uid )
        VALUES (@Name, @Username, @Password,@Email, @Secret, @Uid);
        SELECT SCOPE_IDENTITY() AS AdminID;  
    `;

    const result = await pool
      .request()
      .input("Name", sql.NVarChar, name)
      .input("Username", sql.NVarChar, username)
      .input("Password", sql.NVarChar, hashedPassword)
      .input("Email", sql.NVarChar, email)
      .input("Secret", sql.NVarChar, hashedSecret)
      .input("Uid", sql.NVarChar, uniqueId)
      .query(insertQuery);

    const adminID = result.recordset[0].AdminID;

    // Generate a JWT token with the AdminID
    const tokenPayload = { adminID,uniqueId };
    const token = generateToken(tokenPayload);

    // Construct the response
    const response = {
      message: "Admin registered successfully.",
      user: {
        name,
        username,
        email,
        adminID,
        uniqueId
      },
      token, // Include the token in the response
    };

    // Send the response back
    return res.status(200).json(response);
  } catch (err) {
    console.error("Error signing up admin:", err);
    const response = {
      error: "Error signing up. Please try again later.",
      details: err.message,
    };
    return res.status(500).json(response);
  }
};

//Login Functionality

exports.login = async (req, res) => {
  const { identifier, password } = req.body;

  // Validate required fields
  if (!identifier || !password) {
    const response = {
      error: "Username/Email and password are required.",
    };
    return res.status(400).json(response);
  }

  try {
    const pool = await poolPromise;

    const checkUserQuery = `
      SELECT AdminID, Name, Username, Email, Password, Uid 
      FROM Admins 
      WHERE Username = @Identifier OR Email = @Identifier
    `;
    const result = await pool
      .request()
      .input("Identifier", sql.NVarChar, identifier)
      .query(checkUserQuery);

    // If no user is found
    if (result.recordset.length === 0) {
      const response = {
        error: "Invalid username/email or password.",
      };
      return res.status(401).json(response);
    }

    const user = result.recordset[0];

    //Compare provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.Password);
    if (!isPasswordValid) {
      const response = {
        error: "Invalid username/email or password.",
      };
      return res.status(401).json(response);
    }

    const tokenPayload = { adminID: user.AdminID, uniqueId: user.Uid };
    const token = generateToken(tokenPayload);

    const response = {
      message: "Login successful.",
      user: {
        adminID: user.AdminID,
        name: user.Name,
        username: user.Username,
        email: user.Email,
      },
      token,
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error logging in admin:", err);
    const response = {
      error: "Error logging in. Please try again later.",
      details: err.message,
    };
    return res.status(500).json(response);
  }
};

