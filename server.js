const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, "balances.json");

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "{}");
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/get_balance", (req, res) => {
  const userId = req.query.user_id;

  if (!userId) {
    return res.status(400).json({ error: "user_id жоқ" });
  }

  const data = readData();

  if (!data[userId]) {
    data[userId] = 100;
    writeData(data);
  }

  res.json({ balance: data[userId] });
});

app.post("/update_balance", (req, res) => {
  const { user_id, amount } = req.body;

  if (!user_id || typeof amount !== "number") {
    return res.status(400).json({ error: "Қате дерек" });
  }

  const data = readData();

  if (!data[user_id]) {
    data[user_id] = 100;
  }

  data[user_id] += amount;
  writeData(data);

  res.json({ balance: data[user_id] });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
