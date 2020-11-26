require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

// Initiate express app
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Set up view engine
app.set("view engine", "ejs");

// Connect to MongoDB
mongoose.connect(process.env.DB_URI, 
    { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: true},
    err => {
        if(err) throw err;
        console.log("Connected to MongoDB");
    })


// Routes
app.get("/", (req, res) => {
    res.send("Home page");
})


// Set server to listen at a specific port
app.listen(process.env.PORT, err => {
    if (err) throw err;
    console.log("Server is running");
})