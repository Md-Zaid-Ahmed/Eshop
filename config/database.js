const sql = require("mssql");
require("dotenv").config();

const poolPromise = new sql.ConnectionPool({
  user: process.env.USER,
  password: process.env.PASSWORD,
  server: process.env.SERVER,
  database: process.env.DB_NAME,
  options: {
    trustedConnection: false,
    enableArithAbort: true,
    instanceName: process.env.INSTANCENAME,
    trustServerCertificate: true,
  },
  port: process.env.DB_PORT,
  pool: {
    max: 10,
    min: 0,
  },
})
  .connect()
  .then(pool => {
    console.log("Database connected successfully!");
    return pool; // Return the pool object
  })
  .catch(err => {
    console.error("Database connection failed:", err); // Error log
    process.exit(1); // Exit the process if the connection fails
  });

module.exports = { poolPromise, sql };
