const userService = require("../../services/user/profileService");
const { uploadToCloudinary } = require("../../utils/cloudinary");

async function renderProfile(req, res) {
  try {
    const user = await userService.getUserById(req.session.userId);
    res.render("user/profile/profileDetails", { user });
  } catch (error) {
    console.error("Internal Error:", error);
    req.session.message = {
      type: "error",
      text: "Something went wrong"
    };
    return res.redirect("/");
  }
}

async function updateProfile(req, res) {
  try {
    await userService.updateUserProfile(req.session.userId, req.body);
    return res.json({ status: "SUCCESS" });
  } catch (error) {
      if (error.isOperational) {
        return res.json({ status: "ERROR", message: error.message });
      }
      console.error("Internal Error:", error);
      return res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

async function changePassword(req, res) {
    try {
        await userService.changeUserPassword(req.session.userId, req.body.currentPassword, req.body.newPassword);
        return res.json({ status: "SUCCESS" });
    } catch (error) {
        if (error.isOperational) {
          return res.json({ status: "ERROR", message: error.message });
        }
        console.error("Internal Error:", error);
        return res.json({ status: "ERROR", message: "Something went wrong" });
    }
}

// 🔹 NEW: Profile image upload
async function uploadProfileImage(req, res) {
  try {
    if (!req.file) {
      return res.json({ status: "ERROR", message: "Please select an image" });
    }

    const result = await uploadToCloudinary(req.file.buffer, "wooden-cot/profile");
    const updatedUser = await userService.updateProfileImage(req.session.userId, result.secure_url);

    return res.json({
      status: "SUCCESS",
      imageUrl: updatedUser.profileImage
    });
  } catch (error) {
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.error("Internal Error:", error);
    return res.json({ status: "ERROR", message: "Image upload failed" });
  }
}

// 🔹 NEW: Change email step 1 - send OTP
async function initiateEmailChange(req, res) {
  try {
    const { newEmail, password } = req.body;
    await userService.initiateEmailChange(req.session.userId, newEmail, password);
    return res.json({ status: "SUCCESS", message: "OTP sent to new email" });
  } catch (error) {
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.error("Internal Error:", error);
    return res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

// 🔹 NEW: Change email step 2 - verify OTP
async function verifyEmailChange(req, res) {
  try {
    const { otp } = req.body;
    const updatedUser = await userService.verifyEmailChange(req.session.userId, otp);
    return res.json({ status: "SUCCESS", email: updatedUser.email });
  } catch (error) {
    if (error.isOperational) {
      return res.json({ status: "ERROR", message: error.message });
    }
    console.error("Internal Error:", error);
    return res.json({ status: "ERROR", message: "Something went wrong" });
  }
}

module.exports = {
  renderProfile,
  updateProfile,
  changePassword,
  uploadProfileImage,
  initiateEmailChange,
  verifyEmailChange
};