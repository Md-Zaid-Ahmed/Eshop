const express = require('express');
const app = express();
const port = 3000;

// Import routes
const authRoutes = require('./routes/authRoutes'); // Adjust the path as needed

// Middleware to parse JSON
app.use(express.json());

// Mount the auth routes
app.use('/v1/auth', authRoutes); // All routes in authRoutes.js will be prefixed with /api/auth

// Test route (optional)
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
