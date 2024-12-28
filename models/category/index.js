// Import and export all modules from this folder
const { addCategory } = require("./addCategory");
const { getCategories } = require("./getCategories");
const { getCategory } = require("./getCategory");
const { deleteCategory } = require("./deleteCategory");
const { updateCategory } = require("./updateCategory");

module.exports = {
  addCategory,
  updateCategory,
  getCategories,
  getCategory,
  deleteCategory,
};
