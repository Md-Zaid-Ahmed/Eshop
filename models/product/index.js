// Import and export all modules from this folder

const { addProduct } = require("./addProduct");
const { deleteProduct } = require("./deleteProduct");
const { getProduct } = require("./getProduct");
const { getProducts } = require("./getProducts");
const { updateProduct } = require("./updateProduct");

module.exports = {
  addProduct,
  updateProduct,
  getProduct,
  getProducts,
  deleteProduct

};
