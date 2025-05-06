const mongoose = require("mongoose");

const connectDB = async () => { 
    await mongoose.connect("mongodb+srv://sankalppawar619:123@dev.8aglp50.mongodb.net/?retryWrites=true&w=majority&appName=DEV"); 
};

module.exports = connectDB;