const express = require("express");
const app = express();
const connectDB = require("./config/database");
const User = require("./models/user");

app.use(express.json());

app.post("/signup", async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        res.send("User added successfully!");
    } catch (err) {
        res.status(400).send("Error saving the user:" + err.message);
    }

});

app.get("/user", async (req, res) => {
    const userEmail = req.body.emailId;

    try {
        const user = await User.find({ emailId: userEmail });
        if (user.length === 0) {
            res.status(404).send("user not found")
        } else {
            res.send(user);
        }

    } catch (err) {
        res.status(400).send("Error getting the user:" + err.message);
    }
});

app.get("/feed", async (req, res) => {

    try {
        const users = await User.find({});
        if (!users) {
            res.status(404).send("users not found")
        } else {
            res.send(users);
        }

    } catch (err) {
        res.status(400).send("Error getting the users:" + err.message);
    }
});

app.delete("/user", async (req, res) => {
    const userId = req.body.userId;

    try {
        const user = await User.findByIdAndDelete(userId);
        res.send("user deleted successfully....!");
    } catch (err) {
        res.status(400).send("Something went wrong");
    }
});

app.patch("/user", async (req, res) => {
    const userId = req.body.userId;
    const data = req.body;

    try {
        await User.findByIdAndUpdate({_id:userId}, data);
        res.send("User updated successfully");
    } catch (err) {
        res.status(400).send("Something went wrong")
    }

});

connectDB().then(() => {
    console.log("Database Connection Established....");
    app.listen(7777, () => {
        console.log("Server is running on port 7777");
    });
}).catch((err) => {
    console.error("Database Cannot be connected!!");
});