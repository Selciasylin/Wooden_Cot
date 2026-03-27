const appError = require("../../utils/appError");
async function loginAdmin(email, password){
    if (!email || !password) {
        throw new appError("All fields are required");
    }
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (email !== adminEmail || password !== adminPassword) {
        throw new appError("Invalid email or password");
    }
    return {
        email: adminEmail
    };
};
module.exports={loginAdmin}