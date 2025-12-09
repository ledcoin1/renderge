const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const FILE = 'balances.json';

// Егер файл жоқ болса – жасаймыз
if (!fs.existsSync(FILE)) {
  fs.writeFileSync(FILE, JSON.stringify({}, null, 2));
}

// Балансты оқимыз
function readBalances() {
  return JSON.parse(fs.readFileSync(FILE));
}

// Балансты жазамыз
function saveBalances(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// Mini App балансты сұрайды
app.get('/balance', (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return res.json({ balance: 0 });

  const balances = readBalances();

  if (!balances[userId]) {
    balances[userId] = 0;
    saveBalances(balances);
  }

  res.json({ balance: balances[userId] });
});

// Админ үшін — барлық баланстарды көру
app.get('/admin', (req, res) => {
  const balances = readBalances();
  res.json(balances);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
