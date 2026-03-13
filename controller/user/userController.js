const userService = require("../../services/user/userService");

async function renderSignUp(req, res) {
  res.render("user/auth/signUp");
}
async function renderSignIn(req, res) {
  res.render("user/auth/signIn");
}
async function renderOtpPage(req, res) {
  res.render("user/auth/OTPpage");
}
async function renderforgotPassword(req, res) {
  res.render("user/auth/forgotPassword");
}
async function renderResetPassword(req, res) {
  res.render("user/auth/newPassword");
}
async function renderHome(req, res) {
  res.render("user/homePage");
}

async function register(req, res) {
  try {
    const user = await userService.createUser(req.body);
    req.session.tempUserId = user._id;
    req.session.message = {
      type: "success",
      text: "OTP Sent Successfully!",
    };
    res.redirect("/verifyOtp");
  } catch (error) {
    if (error.isOperational) {
      req.session.message = {
        type: "error",
        text: error.message,
      };
    } else {
      console.error("Internal Error:", error);
      req.session.message = {
        type: "error",
        text: "Something went wrong",
      };
    }
    res.redirect("/signup");
  }
}
async function login(req, res) {
  try {
    const user = await userService.loginUser(req.body);
    req.session.userId = user._id;
    req.session.message = {
      type: "success",
      text: "Login Successfully!",
    };
    return res.json({
      status: "SUCCESS",
    });
  } catch (error) {
    if (error.type === "NOT_VERIFIED") {
      req.session.tempUserId = error.userId;
      return res.json({ status: "NOT_VERIFIED" });
    }
    if (error.isOperational) {
      return res.json({
        status: "ERROR",
        message: error.message,
      });
    }
    console.error("Internal Error:", error);
    return res.json({
      status: "ERROR",
      message: "Something went wrong",
    });
  }
}
async function forgotPassword(req, res) {
  try {
    const user = await userService.forgotPassword(req.body.email);
    req.session.tempUserId = user._id;
    res.redirect("/verifyOtp");
  } catch (error) {
    if (error.isOperational) {
      req.session.message = {
        type: "error",
        text: error.message,
      };
    } else {
      console.error("Internal Error:", error);
      req.session.message = {
        type: "error",
        text: "Something went wrong",
      };
    }
    res.redirect("/forgotPassword");
  }
}
async function verifyOtp(req, res) {
  try {
    if (!req.session.tempUserId) {
      return res.redirect("/signup");
    }
    console.log("Session tempUserId:", req.session.tempUserId);
    console.log("Entered OTP:", req.body.otp);
    const result = await userService.verifyOtp(
      req.session.tempUserId,
      req.body.otp,
    );
    // SIGNUP FLOW
    const user = result.user;
    const purpose = result.purpose;
    if (purpose === "signup") {
      req.session.userId = user._id;
      delete req.session.tempUserId;
      req.session.message = {
        type: "success",
        text: "Account Verified Successfully!",
      };
      return res.redirect("/");
    }
    // FORGOT PASSWORD FLOW
    if (purpose === "forgotPassword") {
      return res.redirect("/resetPassword");
    }
  } catch (error) {
    if (error.isOperational) {
      req.session.message = {
        type: "error",
        text: error.message,
      };
    } else {
      console.error("Internal Error:", error);
      req.session.message = {
        type: "error",
        text: "Something went wrong",
      };
    }
    res.redirect("/verifyOtp");
  }
}
async function resetPassword(req, res) {
  try {
    if (!req.session.tempUserId) {
      return res.redirect("/forgotPassword");
    }
    await userService.resetPassword(
      req.session.tempUserId,
      req.body.newPassword,
    );
    delete req.session.tempUserId;
    req.session.message = {
      type: "success",
      text: "Password reset Successfully!",
    };
    res.redirect("/signin");
  } catch (error) {
    if (error.isOperational) {
      req.session.message = {
        type: "error",
        text: error.message,
      };
    } else {
      console.error("Internal Error:", error);
      req.session.message = {
        type: "error",
        text: "Something went wrong",
      };
    }
    res.redirect("/resetPassword");
  }
}
async function googleCallback(req, res) {
  try {
    const user = req.user;
    if (user.isBlocked) {
      req.session.message = {
        type: "error",
        text: "Your account is blocked",
      };
      return res.redirect("/signin");
    }
    req.session.userId = user._id;
    req.session.message = {
      type: "success",
      text: "Login Successfully!",
    };
    res.redirect("/");
  } catch (error) {
    if (error.isOperational) {
      req.session.message = {
        type: "error",
        text: error.message,
      };
    } else {
      console.error("Internal Error:", error);
      req.session.message = {
        type: "error",
        text: "Something went wrong",
      };
    }
    res.redirect("/login");
  }
}
async function resendSignupOtp(req, res) {
    try {
        if (!req.session.tempUserId) {
            return res.json({ status: "ERROR" });
        }
        await userService.generateSignupOtp(req.session.tempUserId);
        return res.json({ status: "OTP_SENT" });
    } catch (error) {
        console.log("Resend OTP Error:", error);
        return res.json({ status: "ERROR" });
    }
}

module.exports = {
  renderSignUp,
  renderSignIn,
  renderOtpPage,
  renderforgotPassword,
  renderResetPassword,
  register,
  login,
  renderHome,
  forgotPassword,
  verifyOtp,
  resetPassword,
  googleCallback,
  resendSignupOtp
};
