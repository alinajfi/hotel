const passport = require("passport");
const localStrategy = require("passport-local").Strategy;
const personModel = require("./models/person.js");

passport.use(
  new localStrategy(async (userName, passwordFromRequest, done) => {
    try {
      console.log(`Recevided cred ${userName} ${passwordFromRequest}`);
      const user = await personModel.findOne({ username: userName });
      if (!user) return done(null, false, { message: "Incorrect user name" });

      const isPasswordMatch =
        user.password === passwordFromRequest ? true : false;

      if (isPasswordMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: "password dont match" });
      }
    } catch (error) {
      console.log(error);
      return done(`error in logingin insuer ${error}`);
    }
  }),
);

module.exports = passport;
