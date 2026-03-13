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
 async function renderCustomers(req, res) {
    try {
        const users = await authService.getAllUsers();
        res.render("admin/adminManagement/customers", {users});

    } catch (error) {
        console.error("Internal Error:", error);
        req.session.message = {
            type: "error",
            text: "Something went wrong"
        };
        return res.render("admin/adminManagement/customers", { users: [] });
    }
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
async function toggleUserBlock(req, res){
    try {
        const user = await authService.toggleUserBlockStatus(req.params.id);
        return res.json({
            success: true,
            isBlocked: user.isBlocked
        });
    } catch (error) {
        if (error.isOperational) {
        return res.json({
          success: false,
          message: error.message
        });
      }
      console.error("Internal Error:", error);
      return res.json({
        success: false,
        message: "Something went wrong"
      });
    }
}
module.exports = {renderSignIn,validateSignIn,renderDashboard,renderCustomers,toggleUserBlock}