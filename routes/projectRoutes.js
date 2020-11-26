const router = require("express")();
const User = require("../models/User");
const { isEmail } = require("validator")

// Home route
router.get("/", (req, res) => {
    res.render("home")
});


// Signup route
router.get("/signup", (req, res) => {
    res.render("signup");
});

router.post("/signup", async(req, res) => {
    const { username, email, password } = req.body;
    
    if (isEmail(email)) {
        try {
            const user = User.create({ username, email, password });
            console.log(user);
            res.json({ user });
        } catch (err) {
            res.json({ err });
        }
    } else {
        const emailError = "Please enter a valid email";
        res.json({ emailError });
    }
})


router.get("/login", (req, res) => {
    res.render("login");
})

module.exports = router;