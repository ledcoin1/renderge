const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// Тест API
app.get("/ping", (req, res) => {
  res.json({ message: "pong" });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
