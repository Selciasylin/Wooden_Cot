const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const userService = require("../services/user/userService");
const User = require("../model/userSchema"); // your user model

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await userService.handleGoogleUser(profile);
        return done(null, user);
      } 
      catch (error) {
        return done(error, null);
      }
    })
)
// Store user ID in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});
// Fetch user from DB using session ID
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

module.exports = passport;