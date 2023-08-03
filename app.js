const express = require("express");
const app = express();
const mongoose = require("mongoose");
//cookies
const session = require("express-session")
//passport for authentication
const passport =  require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
//don't need to require passport local since you dont need to write it in the code.


app.use(express.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));

app.use(session({
    secret: "Our little secret.",
    resave: false, //
    saveUninitialized: false
}))
app.use(passport.initialize()); //to initialize passport package.
app.use(passport.session()) //tell app to use passport to set up the session

db = mongoose.connect("mongodb://127.0.0.1:27017/userDB")

app.get("/", function(req, res){
    res.render("home")
})

app.get("/login", function(req, res){
    res.render("login")
})

app.get("/register", function(req, res){
    res.render("register")
})

//Level 5 - Cookies and Sessions with passport and express-session

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

userSchema.plugin(passportLocalMongoose); 

const User = mongoose.model("User", userSchema);

//serialise - create cookie, deserialise - open the cookie
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.get("/secrets", function(req, res){
    if (req.isAuthenticated()){
        res.render("secrets")
    } else {
        res.redirect("/login")
    }
})

app.post("/register", function(req,res){
    User.register({username:req.body.username}, req.body.password, function(err, user){
        if (err) {
            console.log(err);
            res.redirect("/register")
        } else {
            passport.authenticate("local")(req, res, function(){ //if successfully authenthicated, redirect to secrets route
                res.redirect("/secrets") //if you're already registered, the get request to /secrets will take care of it.
            })
        }
    })
    


})


app.get("/logout", function(req, res){
    res.logout("/");
    res.redirect("/");
})

app.post("/login", 
    passport.authenticate("local"), function(req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password     
    });
    req.login(user, function(err) {
        if(err) {
            console.log(err);
        } else {
            res.redirect("/secrets");
        }
    });
});


app.listen("3000", function(){
    console.log("Server started on port 3000")
})