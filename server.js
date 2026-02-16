const express = require("express");
const app = express();
const db = require("./db");
require("dotenv").config();
const personModel = require("./models/person.js");
const menuModel = require("./models/Menu.js");
const bodyParser = require("body-parser");
const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
app.use(bodyParser.json());

//middleware to log requests

const logrequest = (req, res, next) => {
  console.log(
    `${new Date().toLocaleString()} Request made to : ${req.originalUrl}`,
  );
  next();
};

passport.use(
  new localStrategy(async (UserName, password, done) => {
    try {
      console.log(`Recevided cred ${UserName} ${password}`);
      const user = await personModel.findOne({ userName: UserName });
      if (!user) return done(null, false, { message: "Incorrect user name" });

      const isPasswordMatch = user.pasword === password ? true : false;

      if (isPasswordMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: "password dont match" });
      }
    } catch (error) {
      return done(`error in logingin insuer ${error}`);
    }
  }),
);

app.use(passport.initialize());

//app.use(logrequest);

app.post(
  "/",
  passport.authenticate("local", { session: false }),
  (req, res) => {
    try {
      res.send("Welcome to the Restaurant Management API");
    } catch (error) {
      res.send(error);
    }
  },
);

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
