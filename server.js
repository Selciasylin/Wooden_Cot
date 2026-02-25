const express=require("express")
require("dotenv").config()
const session = require("express-session");
const userRouter=require("./router/userRouter")
const adminRouter=require("./router/adminRouter")
const connectDB=require("./config/db")
const passport = require("./config/passport");
const app=express()
//databaseConnection
connectDB()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"))
app.set("view engine","ejs")
//session
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 // 1 hour
    }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});
//Router Call
app.use("/",userRouter)
app.use("/admin",adminRouter)


app.listen(process.env.PORT,()=>{
    console.log(`server is listening at http://localhost:${process.env.PORT}`)
})