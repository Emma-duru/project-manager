const router = require("express")();
const User = require("../models/User");

router.get("/", (req, res) => {
    res.render("home")
});

module.exports = router;