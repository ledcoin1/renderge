// server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const DB_FILE = path.join(__dirname, "db.json");

// ensure db exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}
function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// health
app.get("/", (req, res) => res.json({ status: "ok" }));

// --- getBalance (keeps compatibility with frontend) ---
// expects { userId } in POST body
app.post("/getBalance", (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const db = readDB();
    if (!db.users[userId]) db.users[userId] = { balance: 100 };
    writeDB(db);
    return res.json({ balance: db.users[userId].balance });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server error" });
  }
});

// --- play endpoint (keeps old game logic) ---
// expects { userId, choice, bet }
app.post("/play", (req, res) => {
  try {
    const { userId, choice, bet } = req.body;
    if (!userId || !choice || typeof bet !== "number") return res.status(400).json({ error: "invalid data" });

    const options = ["тас", "қағаз", "қайшы"];
    if (!options.includes(choice)) return res.status(400).json({ error: "invalid choice" });

    const db = readDB();
    if (!db.users[userId]) db.users[userId] = { balance: 100 };

    if (db.users[userId].balance < bet) return res.json({ error: "Жеткіліксіз баланс" });

    const computerChoice = options[Math.floor(Math.random() * options.length)];
    let result;
    if (choice === computerChoice) result = "draw";
    else if (
      (choice === "тас" && computerChoice === "қайшы") ||
      (choice === "қағаз" && computerChoice === "тас") ||
      (choice === "қайшы" && computerChoice === "қағаз")
    ) result = "win";
    else result = "lose";

    if (result === "win") db.users[userId].balance += bet;
    else if (result === "lose") db.users[userId].balance -= bet;

    // save a short history (optional)
    db.users[userId].history = db.users[userId].history || [];
    db.users[userId].history.unshift({
      date: new Date().toISOString(),
      choice, computerChoice, result, bet
    });
    if (db.users[userId].history.length > 50) db.users[userId].history.pop();

    writeDB(db);

    return res.json({ result, computerChoice, balance: db.users[userId].balance });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server error" });
  }
});

// --- simple admin-ish endpoints (optional) ---
app.get("/users", (req, res) => {
  const db = readDB();
  res.json(db.users);
});

app.post("/setBalance", (req, res) => {
  const { userId, balance } = req.body;
  if (!userId || typeof balance !== "number") return res.status(400).json({ error: "invalid data" });

  const db = readDB();
  db.users[userId] = db.users[userId] || { balance: 100, history: [] };
  db.users[userId].balance = balance;
  writeDB(db);
  res.json(db.users[userId]);
});

app.listen(PORT, () => console.log("Server running on port", PORT));
