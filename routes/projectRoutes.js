require("dotenv").config();
const router = require("express")();
const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const jwt = require("jsonwebtoken");
const { requireAuth } = require("../middleware/authMiddleware");

// Handle Errors
const handleUserErrors = (err) => {
    const errors = { username: "", email: "", password: "" };

    if (err.code === 11000) {
        const key = Object.keys(err.keyPattern);
        if(key.includes("username")) {
            errors.username = "This username is already registered";
        }

        if(key.includes("email")) {
            errors.email = "This email is already registered";
        }
    }


    if (err.message.includes("User validation failed")) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = properties.message;
        })
    }
    return errors;
}

const handleLoginErrors = (err) => {
    const errors = { username: "", password: ""};
    if (err.message === "Incorrect username") {
        errors.username = "This username is incorrect";
    }

    if (err.message === "Incorrect password") {
        errors.password = "This password is incorrect";
    }

    return errors;
}

const handleProjectErrors = (err) => {
    const errors = { name: "" };

    if (err._message === "Project validation failed") {
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
    

    if (res.locals.user) {
        const { username } = res.locals.user;
        res.redirect(`/${username}`)
    } else {
        res.render("home")
    }
    
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
        const errors = handleUserErrors(err);
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
        const errors = handleLoginErrors(err);
        res.json({ errors });
    }
})

// Logout
router.get("/logout", (req, res) => {
    res.cookie("project_auth", "", {
        maxAge: 1
    })
    res.redirect("/");
})



// User Home Route
router.get("/:username", requireAuth, async(req, res) => {
    const loggedUsername = res.locals.user.username;
    const { username } = req.params;

    if (username === loggedUsername) {
        try {
            const user = await User.findOne({ username }).populate("projects");
            const ongoingProjects = await Project.countDocuments({ user: user._id, isComplete: false });
            res.render("dashboard", { 
                user: user, 
                total_projects: user.projects.length, 
                ongoingProjects: ongoingProjects,
                completedProjects: user.projects.length - ongoingProjects
            });
        } catch(err) {
            res.json({ err });
        }
    } else {
        res.send("You are not allowed to view this page");
    }
    
})

// User Edit Route
router.post("/:username/edit", requireAuth, async(req, res) => {
    const loggedUsername = res.locals.user.username;
    const { username } = req.params;
    const { first_name, last_name, email, bio } = req.body;

    if(loggedUsername == username) {
        try {
            const user = await User.findOneAndUpdate({ username },
                { first_name, last_name, email, bio });
            res.json({ user });
        } catch(err) {
            const errors = handleUserErrors(err);
            res.json({ errors });
        }
    } else {
        res.send("You are not allowed to view this page");
    }

    
})



// Project Create Route
router.post("/:username/project/create", requireAuth, async(req, res) => {
    const loggedUsername = res.locals.user.username;
    const { username } = req.params;
    const { name, description, due_date } = req.body;

    
    if(loggedUsername == username) {
        try {
            const user = await User.findOne({ username });
            const project = await Project.create({ name, description, due_date, user: user._id });
            res.json({ project, user });
        } catch (err) {
            const errors = handleProjectErrors(err);
            res.json({ errors });
        }
    } else {
        res.send("You are not allowed to access this route")
    }
})

// Project route
router.get("/:username/project/:projectId", requireAuth, async(req, res) => {
    const loggedUsername = res.locals.user.username;
    const { username, projectId } = req.params;

    if(loggedUsername == username) {
        try {
            const user = await User.findOne({ username });
            const project = await Project.findOne({ _id: projectId, user: user._id }).populate("tasks");
            const completedTasks = await Task.find({ project: project._id, isComplete: true });
            res.render("project", { project: project, 
                user: user, 
                completedTasks: completedTasks.length,
                ongoingTasks: project.tasks.length - completedTasks.length });
        } catch (err) {
            res.json({ err });
        }
    } else {
        res.send("You are not allowed to access this route")
    }
})

// Project Edit Route
router.post("/:username/project/:projectId/edit", requireAuth, async(req, res) => {
    const loggedUsername = res.locals.user.username;
    const { username, projectId } = req.params;
    const { name, due_date, description } = req.body;

    if(loggedUsername == username) {
        try {
            const user = await User.findOne({ username });
            const project = await Project.findOneAndUpdate(
                { user: user._id, _id: projectId }, 
                { name, due_date, description });
            res.json({ user, project })
        } catch {
            const errors = handleUserErrors(err);
            res.json({ errors });
        }
    } else {
        res.send("You are not allowed to access this route")
    }
})

// Project Delete Route
router.post("/:username/project/:projectId/delete", requireAuth, async(req, res) => {
    const loggedUsername = res.locals.user.username;
    const { username, projectId } = req.params;
    
    if(loggedUsername == username) {
        try {
            const user = await User.findOne({ username });
            await Project.findOneAndDelete({ user: user._id, _id: projectId });
            res.redirect(`/${user.username}`);
        } catch (err) {
            res.json({ err });
        }
    } else {
        res.send("You are not allowed to access this route")
    }
})

// Mark Project as Complete
router.post("/:username/project/:projectId/complete", requireAuth, async(req, res) => {
    const loggedUsername = res.locals.user.username;
    const { username, projectId } = req.params;

    if(loggedUsername == username) {
        try {
            const user = await User.findOne({ username });
            let project = await Project.findOne({ user: user._id, _id: projectId });
            if (project.isComplete) {
                project = await Project.findOneAndUpdate({ _id: project._id }, { isComplete: false })
            } else {
                project = await Project.findOneAndUpdate({ _id: project._id }, { isComplete: true })
            }

            res.json({ project });
        } catch (err) {
            res.json({ err });
        }
    } else {
        res.send("You are not allowed to access this route")
    }
})


// Task Create Route
router.post("/:username/project/:projectId/task/create", requireAuth, async(req, res) => {
    const loggedUsername = res.locals.user.username;
    const { username, projectId } = req.params;
    const { name, description } = req.body;

    if(loggedUsername == username) {
        try {
            const user = await User.findOne({ username });
            const project = await Project.findOne({ _id: projectId, user: user._id });
            const task = await Task.create({ name, description, project: project._id });
            res.json({ user, project, task });
        } catch (err) {
            const errors = handleProjectErrors(err);
            res.json({ errors });
        }
    } else {
        res.send("You are not allowed to access this route")
    }
})

// Task Edit Route
router.post("/:username/project/:projectId/task/:taskId/edit", requireAuth, async(req, res) => {
    const loggedUsername = res.locals.user.username;
    const { username, projectId, taskId } = req.params;
    const { name, description } = req.body;

    if(loggedUsername == username) {
        try {
            const user = await User.findOne({ username });
            const project = await Project.findOne({ _id: projectId, user: user._id });
            const task = await Task.findOneAndUpdate({ project: project._id, _id: taskId }, { name, description });
            res.json({ user, project, task });
        } catch(err) {
            const errors = handleProjectErrors(err);
            res.json({ errors });
        }
    } else {
        res.send("You are not allowed to access this route")
    }
})

// Task Delete
router.post("/:username/project/:projectId/task/:taskId/delete", requireAuth, async(req, res) => {
    const loggedUsername = res.locals.user.username;
    const { username, projectId, taskId } = req.params;

    if(loggedUsername == username) {
        try {
            const user = await User.findOne({ username });
            const project = await Project.findOne({ _id: projectId, user: user._id });
            await Task.findOneAndDelete({ project: project._id, _id: taskId });
            res.redirect(`/${user.username}/project/${project._id}`);
        } catch(err) {
            res.json({ err });
        }
    } else {
        res.send("You are not allowed to access this route")
    }
})


// Mark Task as Complete
router.post("/:username/project/:projectId/task/:taskId/complete", requireAuth, async(req, res) => {
    const loggedUsername = res.locals.user.username;
    const { username, projectId, taskId } = req.params;

    if(loggedUsername == username) {
        try {
            const user = await User.findOne({ username });
            const project = await Project.findOne({ user: user._id, _id: projectId });
            let task = await Task.findOne({ _id: taskId, project: project._id });
            
            if (task.isComplete) {
                task = await Task.findOneAndUpdate({ _id: taskId }, { isComplete: false })
            } else {
                task = await Task.findOneAndUpdate({ _id: taskId }, { isComplete: true })
            }

            res.json({ task });
        } catch (err) {
            res.json({ err });
        }
    } else {
        res.send("You are not allowed to access this route")
    }
})

module.exports = router;