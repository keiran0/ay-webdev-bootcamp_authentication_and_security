const express = require("express");
const app = express();
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption")

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

//Level 2 authentication - Encryption with mongoose-encryption

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

const secret = "Thisisourlittlesecret." //still pretty dangerous. app.js may be revealed, not that difficult to find. But better than no encryption.

//Important to add this plugin to the schema before you create the mongoose model.
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']}) //encrypt entire database without the encryptedFields key. You may not want this, so it is changed to encrypt only the password. It will encrypt when you call 'save', and decrypt when you call 'find'

const User = mongoose.model("User", userSchema);

app.post("/register", function(req,res){

    newUser = new User({
        email: req.body.username,
        password: req.body.password
    })

    newUser.save()

    res.render("secrets")
})

app.post("/login", function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email:username})
        .then(function(user){
            console.log(user)
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