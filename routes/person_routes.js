const express = require("express");
const router = express.Router();
const personModel = require("../models/person.js");

router.get("/", async (req, res) => {
  try {
    const person = await personModel.find();
    res.status(200).json(person);
  } catch (error) {
    console.error("Error fetching persons:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching persons." });
  }
});

router.get("/:workType", async (req, res) => {
  try {
    const workType = req.params.workType;

    if (!["chef", "waiter", "manager"].includes(workType)) {
      return res.status(400).json({ error: "Invalid work type provided." });
    }
    const persons = await personModel.find({ work: workType });
    res.status(200).json(persons);
  } catch (error) {
    console.error("Error fetching persons:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching persons." });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const newPerson = new personModel(data);
    const responseAfterSavingPerson = await newPerson.save();
    console.log("Person saved successfully:");
    res.status(200).json(responseAfterSavingPerson);
  } catch (error) {
    console.error("Error saving person:", error);
    res
      .status(500)
      .json({ error: "An error occurred while saving the person." });
  }
});

module.exports = router;
