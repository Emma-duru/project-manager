require("dotenv").config();
const router = require("express")();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { requireAuth } = require("../middleware/authMiddleware");

// Handle Errors
const handleErrors = (err) => {
    const errors = { username: "", email: "", password: "" };

    if (err.code === 11000) {
        const key = Object.values(err.keyPattern);
        if(key.includes("username")) {
            err.username = "This username is already registered";
        }

        if(key.includes("email")) {
            err.email = "This email is already registered";
        }
    }

    if (err.message.includes("User validation failed")) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        })
    }
    return errors;
}

// Generate JWT
const maxAge = 3 * 24 * 60 * 60;
const createToken = id => {
    const token = jwt.sign({ id }, process.env.SECRET, {
        expiresIn: maxAge
    });
    return token;
}


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

    try {
        const user = await User.create({ username, email, password });
        const token = createToken(user._id);
        res.cookie("project_auth", token, {
            httpOnly: true,
            maxAge: maxAge * 1000
        });
        res.json({ user });
    } catch (err) {
        const errors = handleErrors(err);
        res.json({ errors });
    }
})



// Login route
router.get("/login", (req, res) => {
    res.render("login");
})

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.login(username, password);
        const token = createToken(user._id);
        res.cookie("project_auth", token, {
            httpOnly: true,
            maxAge: maxAge * 1000
        });
        res.json({ user });
    } catch (err) {
        const errors = handleErrors(err);
        res.json({ errors });
    }
})



// Logout
router.get("/logout", (req, res) => {
    res.cookie("profile_auth", "", {
        maxAge: 1
    })
    res.redirect("/");
})



// User Home Route
router.get("/:username", requireAuth, async(req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username });
        res.render("dashboard", { user: user });
    } catch(err) {
        res.json({ err });
    }
})



// Edit Route
router.post("/:username/edit", requireAuth, async(req, res) => {
    const { username } = req.params;
    const { first_name, last_name, email, bio } = req.body;

    try {
        const user = await User.findOneAndUpdate({ username },
            { first_name, last_name, email, bio });
        res.json({ user });
    } catch(err) {
        const errors = handleErrors(err);
        res.json({ errors });
    }
})








module.exports = router;