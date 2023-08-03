require('dotenv').config()
const express = require("express");
const app = express();
const mongoose = require("mongoose");
//cookies
const session = require("express-session")
//passport for authentication
const passport =  require("passport") //You are still using passport for authentication, just with a google strategy that allows for oauth
const passportLocalMongoose = require("passport-local-mongoose")//don't need to require passport local since you dont need to write it in the code.

//Deviation from course: Had an issue with the google auth not allowing access due to 'SSL received a record that exceeded the maximum permissible length'. Workaround for https instead of http. At least this way, can disregard the warnings for SSL
const fs = require("fs")
const https = require("https")

//use google as a passport strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
//use facebook as a passport strategy



//Deviation from course
https
    .createServer({
        key:fs.readFileSync("server.key"),
        cert: fs.readFileSync("server.cert"),

    },app)

    .listen(3000, function(){
        console.log("App running on https://localhost:3000")
    })


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

//Level 6 - OAuth with Google

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
})

userSchema.plugin(passportLocalMongoose); 
userSchema.plugin(findOrCreate)

const User = mongoose.model("User", userSchema);

//comes from passport local mongoose. But this is using local strategy, not all strategies.
// passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser())
// passport.deserializeUser(User.deserializeUser())

//can work with any kind of authentication
passport.serializeUser(function(user, done){
    done(null, user.id)
})

passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) { //profile contains email etc.
    //console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) { //find/create user if doesnt exist. This is not mongodb/mongoose function. You have to implement it yourself. Alternatively, you can install mongoose-findorcreate to make it work. 
      return cb(err, user);
    });
  }
));



app.get("/secrets", function(req, res){
    if (req.isAuthenticated()){
        User.find({"secret":{$ne:null}})
            .then(function(usersWithSecrets){
                res.render("secrets", {usersWithSecrets: usersWithSecrets})
            })
            .catch(function(err){
                console.log(err)
            })
        
    } else {
        res.redirect("/login")
    }
})

app.get("/auth/google", passport.authenticate("google", {
    failureRedirect: "login"
    ,scope: ["profile"]}),
    function(req, res) {
      res.redirect("/secrets");
    }
  );

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

app.get('/auth/google/secrets', //match what you specified to google previously under auth redirect urls
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    console.log("authentication successful.")
    res.redirect('/secrets');
  });

app.get("/logout", function(req, res){
    req.logout(function(){
        console.log("logged out")
    });
    res.redirect("/");
  });

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

app.get("/submit", function(req, res){
    if (req.isAuthenticated()) {
        res.render("submit")
    } else {
        res.redirect("/")
    }

})

app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
    console.log(req.user)
    User.findById(req.user)
        .then(function(user){
            user.secret = submittedSecret
            user.save()
            res.redirect("/")
        })
        .catch(function(err){
            console.log(err)
        })

})

// app.listen("3000", function(){
//     console.log("Server started on port 3000")
// })