// Import and export all modules from this folder

const { createEmployee } = require("./createEmployee");
const { deleteEmployee } = require("./deleteEmployee");
const { getEmployee } = require("./getEmployee");
const { getEmployees } = require("./getEmployees");
const { updateEmployee } = require("./updateEmployee");



module.exports = {
  createEmployee,
  getEmployee,
  getEmployees,
  updateEmployee,
  deleteEmployee
};
