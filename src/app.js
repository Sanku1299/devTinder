const express = require("express");
const app = express();
const connectDB = require("./config/database");
const User = require("./models/user");

app.post("/signup", async (req, res) => {
    const user = new User({
        firstName: "Sachin",
        lastName: "Tendulkar",
        emailId: "sachin@gmail.com",
        password: "Sachin@123"
    });

    await user.save();
    res.send("User added successfully!");
})

connectDB().then(() => {
    console.log("Database Connection Established....");
    app.listen(7777, () => {
        console.log("Server is running on port 7777");
    });
}).catch((err) => {
    console.error("Database Cannot be connected!!");
});