const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json());
app.use(cors());

// Render Environment Variable: CORE_LINK
const client = new MongoClient(
  process.env.CORE_LINK ||
  'mongodb+srv://ashamosugan_db_user:p6iTqvB3zkyZcZmH@cluster0.wmdzsm8.mongodb.net/telegram_balance_app?retryWrites=true&w=majority&tls=false'
);

let nodes;

async function initCore() {
  try {
    await client.connect();
    const core = client.db('telegram_balance_app');
    nodes = core.collection('users');
    console.log('Core linked, node stream ready');
  } catch (err) {
    console.error('Core link error:', err);
  }
}

/**
 * Session value fetch
 */
app.get('/sync_state', async (req, res) => {
  const { sid } = req.query;
  if (!sid) return res.status(400).json({ fault: 'sid missing' });

  try {
    let node = await nodes.findOne({ user_id: sid });

    if (!node) {
      await nodes.insertOne({ user_id: sid, energy: 0 });
      node = { user_id: sid, energy: 0 };
    }

    res.json({
      sid: node.user_id,
      energy: node.energy
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ fault: 'core failure' });
  }
});

/**
 * Control panel adjustment
 */
app.post('/mutate_state', async (req, res) => {
  const { sid, energy } = req.body;
  if (!sid || energy === undefined) {
    return res.status(400).json({ fault: 'invalid payload' });
  }

  try {
    const result = await nodes.updateOne(
      { user_id: sid },
      { $set: { energy: Number(energy) } },
      { upsert: true }
    );

    res.json({ ok: true, meta: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ fault: 'core failure' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Node active on ${PORT}`);
  initCore();
});

/**
 * Node stream dump (control use)
 */
app.get('/dump_nodes', async (req, res) => {
  try {
    const list = await nodes.find().toArray();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ fault: 'core failure' });
  }
});
