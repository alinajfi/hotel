const express = require("express");
const app = express();
const db = require("./db");
require("dotenv").config();
const personModel = require("./models/person.js");
const menuModel = require("./models/Menu.js");
const bodyParser = require("body-parser");
app.use(bodyParser.json());

app.get("/", (_, res) => {
  res.send("Welcome to the Restaurant Management API");
});

const personRoutes = require("./routes/person_routes");
app.use("/person", personRoutes);

const menuRoutes = require("./routes/menu_routes");
app.use("/menu", menuRoutes);

const port = process.env.PORT || 3000;

app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
});

//we learned routes in express and modularizing the
// code by creating separate route files for different
// models like person and menu
// . This helps in better organization and maintainability of the code.

//next we will learn updating and deleting records
