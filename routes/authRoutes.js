const express = require("express");
const { signup, login } = require("../controllers/AdminAuth");
const { EmployeeLogin } = require("../controllers/EmployeeAuth");
const router = express.Router();

router.post("/signup", signup);
router.post("/adminLogin", login);
router.post("/employeeLogin", EmployeeLogin);
module.exports = router;
