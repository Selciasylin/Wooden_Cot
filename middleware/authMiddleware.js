const User = require("../model/userSchema");

async function isLoggedIn(req, res, next) {
    if (!req.session.userId) {
        return res.redirect("/signin");
    }

    try {
        const user = await User.findById(req.session.userId);

        if (!user || user.isBlocked) {
            return req.session.destroy(() => {
                res.clearCookie("connect.sid");
                res.redirect("/signin?message=Your account has been blocked&type=error");
            });
        }

        req.user = user; // bonus: controllers la use pannalam, extra DB call thevai illa
        next();
    } catch (error) {
        console.error("isLoggedIn middleware error:", error);
        return res.redirect("/signin");
    }
}

async function preventAuthAccess(req, res, next) {
    if (req.session.userId) {
        return res.redirect('/');
    }
    next();
}

module.exports = { isLoggedIn, preventAuthAccess };