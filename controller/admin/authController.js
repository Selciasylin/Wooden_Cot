const authService = require("../../services/admin/authService")
async function renderSignIn(req, res){
    if (req.session.isAdmin) {
        return res.redirect("/admin/dashboard");
    }
    res.render("admin/auth/adminAuth");
};
async function renderDashboard(req,res){
    res.render("admin/dashboard")
}
async function validateSignIn(req, res){
    try {
        const { email, password } = req.body;
        await authService.loginAdmin(email, password);
        req.session.isAdmin = true;
        req.session.message = {
            type: "success",
            text: "Admin login successful!"
        };
        res.redirect("/admin/dashboard");
    } catch (error) {
        if (error.isOperational) {
            req.session.message = {
                type: "error",
                text: error.message
            };
        } else {
            console.error("Internal Error:", error);
            req.session.message = {
                type: "error",
                text: "Something went wrong"
            };
        }
        res.redirect("/admin/signin");
    }
};

module.exports = {renderSignIn,validateSignIn,renderDashboard}