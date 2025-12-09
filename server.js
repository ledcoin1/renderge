// server.js
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB қосылым деректері
const uri = "mongodb+srv://ashamosugan_db_user:p6iTqvB3zkyZcZmH@cluster0.wmdzsm8.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);
let balancesCollection;

// MongoDB қосу
async function connectDB() {
  await client.connect();
  const db = client.db("telegram_balance_app");
  balancesCollection = db.collection("balances");
  console.log("Connected to MongoDB");
}

connectDB().catch(console.error);

// Баланс алу
app.get("/get_balance", async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return res.status(400).json({ error: "user_id керек" });

  let user = await balancesCollection.findOne({ user_id: userId });
  if (!user) {
    user = { user_id: userId, balance: 0 };
    await balancesCollection.insertOne(user);
  }
  res.json({ balance: user.balance });
});

// Баланс жаңарту (админ үшін)
app.post("/update_balance", async (req, res) => {
  const { user_id, balance } = req.body;
  if (!user_id || typeof balance !== "number") return res.status(400).json({ error: "Дұрыс дерек жоқ" });

  const result = await balancesCollection.updateOne(
    { user_id },
    { $set: { balance } },
    { upsert: true }
  );
  res.json({ success: true });
});

// Тек тест үшін root
app.get("/", (req, res) => {
  res.send("Telegram Mini App Backend is running!");
});

// Render-ге арналған порт
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

