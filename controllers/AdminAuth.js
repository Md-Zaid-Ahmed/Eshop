const bcrypt = require("bcrypt");
const { poolPromise, sql } = require("../config/database");
const { generateToken } = require("../utils/jwt");
const ShortUniqueId = require('short-unique-id');


exports.signup = async (req, res) => {
  let { name, username, password, secret , u_id} = req.body;
  

  // Validate required fields
  if (!name || !username || !password) {
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
    let uniqueId = uid(6);
    u_id = "ycs8zq"

    // Check if email or username already exists
    const checkUserQuery = `
      SELECT COUNT(*) AS count 
      FROM Admin 
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
        INSERT INTO Admin (Name, Username, Password, Secret, Uid)
        VALUES (@Name, @Username, @Password, @Secret, @Uid);
        SELECT SCOPE_IDENTITY() AS AdminID;  
    `;

    const result = await pool
      .request()
      .input("Name", sql.NVarChar, name)
      .input("Username", sql.NVarChar, username)
      .input("Password", sql.NVarChar, hashedPassword)
      .input("Secret", sql.NVarChar, hashedSecret)
      .input("Uid", sql.NVarChar, u_id)
      .query(insertQuery);

    const adminID = result.recordset[0].AdminID;

    // Generate a JWT token with the AdminID
    const tokenPayload = { adminID,u_id };
    const token = generateToken(tokenPayload);

    // Construct the response
    const response = {
      message: "Admin registered successfully.",
      user: {
        name,
        username,
        adminID,
        u_id
      },
      token, // Include the token in the response
    };

    // Send the response back
    return res.status(201).json(response);
  } catch (err) {
    console.error("Error signing up admin:", err);
    const response = {
      error: "Error signing up. Please try again later.",
      details: err.message,
    };
    return res.status(500).json(response);
  }
};
