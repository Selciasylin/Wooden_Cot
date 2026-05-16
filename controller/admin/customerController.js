const customerService = require("../../services/admin/customerService")
//const userService=require("../../services/user/userService")
async function renderCustomers(req, res) {
    try {
        const users = await customerService.getAllUsers();
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
async function toggleUserBlock(req, res){
    try {
        const user = await customerService.toggleUserBlockStatus(req.params.id);
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
async function getCustomersData(req, res) {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = 5
    const search = req.query.search || ""
    const query = {
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    }
    const total = await customerService.countUsers(query)
    const users = await customerService.getUsers(query, page, limit)
    res.json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    })

  } catch (error) {
    console.error(error)
    res.json({ success:false, message:"Something went wrong" })
  }
}
module.exports = {renderCustomers,toggleUserBlock,getCustomersData}