const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const core = express();
core.use(express.json());
core.use(cors());

// Render ENV: MONGO_URI
const bridge = new MongoClient(
  process.env.MONGO_URI ||
  'mongodb+srv://ashamosugan_db_user:p6iTqvB3zkyZcZmH@cluster0.wmdzsm8.mongodb.net/telegram_balance_app?retryWrites=true&w=majority&tls=false'
);

let storage;

async function bootCore() {
  try {
    await bridge.connect();
    const vault = bridge.db('telegram_balance_app');
    storage = vault.collection('users');
    console.log('Core online, storage ready');
  } catch (fault) {
    console.error('Core connection fault:', fault);
  }
}

// USER STATE FETCH (balance)
core.get('/get_balance', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }

  try {
    let node = await storage.findOne({ user_id });

    if (!node) {
      await storage.insertOne({ user_id, balance: 0 });
      node = { user_id, balance: 0 };
    }

    res.json({
      user_id: node.user_id,
      balance: node.balance
    });
  } catch (fault) {
    console.error(fault);
    res.status(500).json({ error: 'Server error' });
  }
});

// CONTROL PANEL UPDATE (admin)
core.post('/set_balance', async (req, res) => {
  const { user_id, balance } = req.body;

  if (!user_id || balance === undefined) {
    return res.status(400).json({ error: 'user_id and balance required' });
  }

  try {
    const meta = await storage.updateOne(
      { user_id },
      { $set: { balance: Number(balance) } },
      { upsert: true }
    );

    res.json({ success: true, result: meta });
  } catch (fault) {
    console.error(fault);
    res.status(500).json({ error: 'Server error' });
  }
});

// ALL USERS SNAPSHOT (admin)
core.get('/get_all_users', async (req, res) => {
  try {
    const snapshot = await storage.find().toArray();
    res.json(snapshot);
  } catch (fault) {
    console.error(fault);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 10000;
core.listen(PORT, () => {
  console.log(`Core running on port ${PORT}`);
  bootCore();
});
