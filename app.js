const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();

app.use(
  cors({
    credentials: "true",
    origin: "http://localhost:4000",
  })
);

app.use(express.json());
const mongoURL = process.env.MONGODB_URL;
const port = process.env.PORT || 4000;
mongoose
  .connect(mongoURL)
  .then(() => {
    console.log("mongod db connected successfully");

    app.listen(port, () => {
      console.log(`Server connected successfully on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("connection error", err);
  });
