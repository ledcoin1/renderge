const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());
app.use(cors());

const client = new MongoClient(
  process.env.MONGO_URI ||
  "mongodb+srv://ashamosugan_db_user:p6iTqvB3zkyZcZmH@cluster0.wmdzsm8.mongodb.net/telegram_balance_app?retryWrites=true&w=majority&tls=false"
);

let users;

async function connectDB() {
  await client.connect();
  const db = client.db("telegram_balance_app");
  users = db.collection("users");
  console.log("DB READY");
}

/* ================= BALANCE ================= */

// FRONTEND: GET /balance/:id
app.get("/balance/:id", async (req, res) => {
  const id = req.params.id;

  let user = await users.findOne({ user_id: id });
  if (!user) {
    await users.insertOne({ user_id: id, balance: 0 });
    user = { user_id: id, balance: 0 };
  }

  res.json({ balance: user.balance });
});

// ADMIN
app.post("/set_balance", async (req, res) => {
  const { user_id, balance } = req.body;

  await users.updateOne(
    { user_id },
    { $set: { balance: Number(balance) } },
    { upsert: true }
  );

  res.json({ ok: true });
});

/* ================= GAME ================= */

// 🔴 МІНЕ ОСЫ ЖЕТІСПЕЙ ТҰРҒАН НӘРСЕ
app.post("/playRPS", async (req, res) => {
  const { id, bet, choice } = req.body;

  let user = await users.findOne({ user_id: id });
  if (!user || user.balance < bet) {
    return res.json({
      result: "Not enough balance",
      win: false,
      draw: false,
      balance: user?.balance || 0
    });
  }

  const bot = ["rock", "paper", "scissors"][
    Math.floor(Math.random() * 3)
  ];

  let win = false;
  let draw = false;

  if (choice === bot) draw = true;
  else if (
    (choice === "rock" && bot === "scissors") ||
    (choice === "paper" && bot === "rock") ||
    (choice === "scissors" && bot === "paper")
  ) win = true;

  let newBalance = user.balance;

  if (win) newBalance += bet * 1.85;
  else if (!draw) newBalance -= bet;

  await users.updateOne(
    { user_id: id },
    { $set: { balance: newBalance } }
  );

  res.json({
    bot,
    win,
    draw,
    result: win ? "rafg" : draw ? "moxo" : "teln",
    balance: newBalance
  });
});

/* ========================================= */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  connectDB();
  console.log("SERVER LIVE", PORT);
});
