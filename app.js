const express = require("express");
const app = express();
const mongoose = require("mongoose");
const md5 = require("md5")
db = mongoose.connect("mongodb://127.0.0.1:27017/userDB")

app.use(express.urlencoded({extended:true}));
app.set("view engine","ejs");
app.use(express.static("public"));

app.get("/", function(req, res){
    res.render("home")
})

app.get("/login", function(req, res){
    res.render("login")
})

app.get("/register", function(req, res){
    res.render("register")
})

//Level 4 - Hashing with MD5

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

const User = mongoose.model("User", userSchema);

app.post("/register", function(req,res){

    newUser = new User({
        email: req.body.username,
        password: md5(req.body.password) //turn password into hash. Hard to reverse into plaintext.
    })

    newUser.save()

    res.render("secrets")
})

app.post("/login", function(req, res){
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({email:username})
        .then(function(user){
            if (user.password === password){
                res.render("secrets");
            } else {
                res.send("Wrong password.")
            }
        })
        .catch(function(err){
            console.log(err)
        })

})


app.listen("3000", function(){
    console.log("Server started on port 3000")
})