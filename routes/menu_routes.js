const express = require("express");
const menurouter = express.Router();
const menuModel = require("../models/Menu.js");

menurouter.post("/", async (req, res) => {
  try {
    const data = req.body;
    const menuItem = new menuModel(data);
    const respone = await menuItem.save();
    res.status(200).json(respone);
  } catch (error) {
    console.log("Error saving menu item:", error);
    res
      .status(500)
      .json({ error: "An error occurred while saving the menu item." });
  }
});

menurouter.get("/", async (req, res) => {
  try {
    res.status(200).json(await menuModel.find());
  } catch (error) {
    console.log("Error saving menu item:", error);
    res
      .status(500)
      .json({ error: "An error occurred while saving the menu item." });
  }
});

menurouter.put("/:itemId", async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const updatedItem = await menuModel.findByIdAndUpdate(itemId, req.body);
    res.status(200).json(updatedItem);
  } catch (error) {
    console.log("Error saving menu item:", error);
    res
      .status(500)
      .json({ error: "An error occurred while saving the menu item." });
  }
});

menurouter.delete("/:itemId", async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const deletedItem = await menuModel.findByIdAndDelete(itemId);
    res.status(200).json(deletedItem);
  } catch (error) {
    console.log("Error deleting menu item:", error);
    res
      .status(500)
      .json({ error: "An error occurred while saving the menu item." });
  }
});

module.exports = menurouter;
