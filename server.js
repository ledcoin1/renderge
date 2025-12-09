const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());
app.use(cors());

const uri = "mongodb+srv://ashamosugan_db_user:p6iTqvB3zkyZcZmH@cluster0.wmdzsm8.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(MONGO_URI);

let balancesCollection;

async function startServer() {
  await client.connect();
  const db = client.db("telegram_balance_app");
  balancesCollection = db.collection("balances");

  app.listen(10000, () => console.log("Server running on port 10000"));
}

startServer();

// Қарапайым фронтенд үшін ойыншылар балансы
app.get('/get_balance', async (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return res.status(400).json({ error: 'user_id керек' });

  let user = await balancesCollection.findOne({ user_id: userId });
  if (!user) {
    await balancesCollection.insertOne({ user_id: userId, balance: 0 });
    user = { user_id: userId, balance: 0 };
  }
  res.json({ balance: user.balance });
});

// Админ бетке арналған API
app.get('/admin/balances', async (req, res) => {
  const allUsers = await balancesCollection.find({}).toArray();
  res.json(allUsers);
});

app.post('/admin/set_balance', async (req, res) => {
  const { user_id, balance } = req.body;
  if (!user_id || typeof balance !== 'number') return res.status(400).json({ error: 'Қате деректер' });

  await balancesCollection.updateOne(
    { user_id },
    { $set: { balance } },
    { upsert: true }
  );
  res.json({ success: true });
});
