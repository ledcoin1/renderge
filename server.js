const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());
app.use(cors());

// ENV: MONGO_URI
const client = new MongoClient(
  process.env.MONGO_URI ||
  "mongodb+srv://ashamosugan_db_user:p6iTqvB3zkyZcZmH@cluster0.wmdzsm8.mongodb.net/telegram_balance_app?retryWrites=true&w=majority&tls=false"
);

let units;

async function boot() {
  await client.connect();
  const db = client.db("telegram_balance_app");
  units = db.collection("users");
  console.log("core ready");
}

/* =========================
   ENERGY (BALANCE) SECTION
   ========================= */

// GET /balance/:id  (frontend соны шақырады)
app.get("/balance/:id", async (req, res) => {
  const id = req.params.id;

  let unit = await units.findOne({ uid: id });
  if (!unit) {
    await units.insertOne({ uid: id, energy: 0 });
    unit = { uid: id, energy: 0 };
  }

  res.json({ balance: unit.energy });
});

// ADMIN / PANEL
app.post("/set_balance", async (req, res) => {
  const { user_id, balance } = req.body;

  await units.updateOne(
    { uid: user_id },
    { $set: { energy: Number(balance) } },
    { upsert: true }
  );

  res.json({ ok: true });
});

/* =========================
   GAME FLOW (RPS)
   ========================= */

app.post("/syncFlow", async (req, res) => {
  const { id, input, mode, bet, choice } = req.body;

  const value = Number(input ?? bet);
  const pick = mode ?? choice;

  let unit = await units.findOne({ uid: id });
  if (!unit || unit.energy < value) {
    return res.json({
      result: "Not enough energy",
      win: false,
      draw: false,
      balance: unit?.energy ?? 0
    });
  }

  const bot = ["rock", "paper", "scissors"][
    Math.floor(Math.random() * 3)
  ];

  let win = false;
  let draw = false;

  if (pick === bot) draw = true;
  else if (
    (pick === "rock" && bot === "scissors") ||
    (pick === "paper" && bot === "rock") ||
    (pick === "scissors" && bot === "paper")
  ) win = true;

  let delta = 0;
  if (win) delta = value * 1.85;
  else if (!draw) delta = -value;

  const newEnergy = unit.energy + delta;

  await units.updateOne(
    { uid: id },
    { $set: { energy: newEnergy } }
  );

  res.json({
    bot,
    win,
    draw,
    result: win ? "rafg" : draw ? "moxo" : "teln",
    balance: newEnergy
  });
});

/* ========================= */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  boot();
  console.log("server live on", PORT);
});
