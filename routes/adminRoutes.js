const express = require("express");
const {addCategory, updateCategory, getCategories, getCategory, deleteCategory,} = require("../models/category");

const { createEmployee} = require("../models/createEmployee");
const router = express.Router();

router.post("/createEmployee", createEmployee);


//Category Routes 
router.post("/addCategory/:name", addCategory);
router.put("/updateCategory/:categoryID/CategoryName/:name", updateCategory);
router.get("/getCategories", getCategories);
router.get("/getCategory", getCategory);
router.delete("/deleteCategory/:categoryID",deleteCategory);
module.exports = router;
