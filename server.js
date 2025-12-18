// --------------------
// 1️⃣ Imports
// --------------------
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// --------------------
// 2️⃣ Environment Variables
// --------------------
const MONGO_URL = process.env.MONGO_URL;
const ADMIN_KEY = process.env.ADMIN_KEY;

// --------------------
// 3️⃣ MongoDB Connection
// --------------------
mongoose.connect(MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// --------------------
// 4️⃣ Player Schema
// --------------------
const playerSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  balance: { type: Number, default: 0 }
});
const Player = mongoose.model("Player", playerSchema);

// --------------------
// 5️⃣ API Endpoints
// --------------------

// 5.1 Get Balance
app.get("/balance/:id", async (req, res) => {
  try {
    let player = await Player.findOne({ id: req.params.id });
    if (!player) player = await Player.create({ id: req.params.id, balance: 0 });
    res.json({ balance: player.balance });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 5.2 Update Balance (Admin)
app.post("/updateBalance", async (req, res) => {
  if (req.headers["admin-key"] !== ADMIN_KEY) return res.status(401).send("Unauthorized");

  const { id, balance } = req.body;
  if (!id || balance == null) return res.status(400).send("Invalid data");

  try {
    const player = await Player.findOneAndUpdate(
      { id },
      { balance },
      { new: true, upsert: true }
    );
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 5.3 All Players (Admin)
app.get("/allPlayers", async (req, res) => {
  if (req.headers["admin-key"] !== ADMIN_KEY) return res.status(401).send("Unauthorized");

  try {
    const players = await Player.find();
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 4️⃣ Rock Paper Scissors
app.post("/playRPS", async (req, res) => {
  const { id, bet, choice } = req.body;

  if (!id || !bet || !choice) {
    return res.status(400).json({ error: "Invalid data" });
  }

  let player = await Player.findOne({ id });
  if (!player) {
    player = await Player.create({ id, balance: 0 });
  }

  // Balance check
  if (player.balance < bet) {
    return res.json({
      error: "NOT_ENOUGH_BALANCE",
      message: "Not enough balance!",
      balance: player.balance
    });
  }

  const options = ["rock", "paper", "scissors"];
  const bot = options[Math.floor(Math.random() * 3)];

  let win = false;
  let draw = false;

  if (choice === bot) {
    draw = true;
  } else if (
    (choice === "rock" && bot === "scissors") ||
    (choice === "paper" && bot === "rock") ||
    (choice === "scissors" && bot === "paper")
  ) {
    win = true;
  }

  // 🟢 WIN MULTIPLIER — 1.85
  const multiplier = 1.85;

  if (win) {
    player.balance += bet * multiplier;
  } else if (!draw) {
    player.balance -= bet;
  }

  await player.save();

  res.json({
    result: win ? "You won!" : draw ? "Draw!" : "You lost...",
    bot,
    win,
    draw,
    balance: player.balance,
    winAmount: win ? bet * multiplier : 0
  });
});
