const router = require("express")();
const User = require("../models/User");

router.get("/", (req, res) => {
    res.render("home")
});

router.get("/signup", (req, res) => {
    res.render("signup");
});

router.get("/login", (req, res) => {
    res.render("login");
})

module.exports = router;