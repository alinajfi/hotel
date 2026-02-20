const express = require("express");
const app = express();
const db = require("./db");
require("dotenv").config();
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const passport = require("./auth.js");

app.use(passport.initialize());
const localStrategy = passport.authenticate("local", { session: false });

app.post("/", localStrategy, (req, res) => {
  try {
    res.send("Welcome to the Restaurant Management API");
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

const personRoutes = require("./routes/person_routes");
app.use("/person", localStrategy, personRoutes);

const menuRoutes = require("./routes/menu_routes");
app.use("/menu", menuRoutes);

const port = process.env.PORT || 3000;

app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
});
