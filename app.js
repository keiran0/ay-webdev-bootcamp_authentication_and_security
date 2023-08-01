const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt")
const saltRounds = 10;

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

//Level 4 - Hashing with bcrypt

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})

const User = mongoose.model("User", userSchema);

app.post("/register", function(req,res){
    bcrypt.hash(req.body.password, saltRounds, function(err, hash){
        const newUser = new User({
            email: req.body.username,
            password: hash
        })
        newUser.save()
    })
    

    res.render("secrets")
})

app.post("/login", function(req, res){
    const username = req.body.username;
    
        User.findOne({email:username})
            .then(function(user){
                const hash =  user.password;
                bcrypt.compare(req.body.password, hash, function(err, result){
                    if (result===true){
                        res.render("secrets")
                    } else {
                        res.send("Wrong password.")
                    }
                })
            })
            .catch(function(err){
                console.log(err)
            })

})


app.listen("3000", function(){
    console.log("Server started on port 3000")
})