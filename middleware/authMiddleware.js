 async function isLoggedIn(req, res, next) {
    if (!req.session.userId) {
        return res.redirect("/signin");
    }
    next();
}
async function preventAuthAccess(req, res, next) {
    if (req.session.userId) {
        return res.redirect('/');
    }
    next();
}
module.exports={isLoggedIn,preventAuthAccess}
