const express = require("express");
const connectDB = require("./config/database");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");

const routers = [authRouter, profileRouter, requestRouter, userRouter];
app.use("/api", ...routers);
app.use("/api", (req, res) => res.sendStatus(404));
app.get("/healthz", (req, res) => res.sendStatus(200));

if (process.env.NODE_ENV === "production") {
  const path = require("node:path");
  const dist = path.resolve(__dirname, "../web/dist");
  app.use(express.static(dist));
  app.get("/{*path}", (req, res) => res.sendFile(path.join(dist, "index.html")));
} else {
  app.use("/", ...routers);
}

if (!process.env.JWT_SECRET || !process.env.MONGODB_URI) {
  throw new Error("Set JWT_SECRET and MONGODB_URI before starting the server.");
}
const port = process.env.PORT || 7777;

connectDB()
  .then(() => {
    console.log("Database connection established...");
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed. Check MONGODB_URI and database network access.");
    process.exitCode = 1;
  });