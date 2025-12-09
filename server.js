const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const BALANCE_FILE = './balances.json';

// файл оқу
function readBalances() {
  if (!fs.existsSync(BALANCE_FILE)) return {};
  return JSON.parse(fs.readFileSync(BALANCE_FILE, 'utf8'));
}

// файл жазу
function writeBalances(data) {
  fs.writeFileSync(BALANCE_FILE, JSON.stringify(data, null, 2));
}

// ✅ қарапайым тест page
app.get('/', (req, res) => {
  res.send('Server OK');
});

// ✅ ойыншы балансын алу
app.get('/get_balance', (req, res) => {
  const id = req.query.user_id;
  if (!id) return res.json({ error: 'no user_id' });

  const data = readBalances();
  if (!data[id]) data[id] = 0;
  writeBalances(data);

  res.json({ balance: data[id] });
});

// ✅ сен қолмен баланс өзгертетін админ API
app.post('/admin/set', (req, res) => {
  const { user_id, balance } = req.body;

  const data = readBalances();
  data[user_id] = balance;
  writeBalances(data);

  res.json({ ok: true });
});

// ✅ барлық ойыншыларды көру
app.get('/admin/all', (req, res) => {
  res.json(readBalances());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Run on', PORT));
