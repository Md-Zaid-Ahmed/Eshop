const express = require("express");
const { signup, login } = require("../controllers/AdminAuth");

const router = express.Router();

router.post("/signup", signup);
router.post("/adminLogin", login);
module.exports = router;
