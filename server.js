const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors()); // Mini App серверге сұрау жіберу үшін

const BALANCE_FILE = 'balances.json';

// Баланстарды оқу/жазу
function readBalances() {
  if (!fs.existsSync(BALANCE_FILE)) return {};
  return JSON.parse(fs.readFileSync(BALANCE_FILE));
}
function writeBalances(balances) {
  fs.writeFileSync(BALANCE_FILE, JSON.stringify(balances, null, 2));
}

// Баланс алу
app.get('/get_balance', (req, res) => {
  const userId = req.query.user_id;
  if (!userId) return res.status(400).json({ error: 'user_id керек' });
  const balances = readBalances();
  if (!balances[userId]) balances[userId] = 0; // жаңа ойыншыға бастапқы баланс
  writeBalances(balances);
  res.json({ balance: balances[userId] });
});

// Баланс жаңарту
app.post('/update_balance', (req, res) => {
  const { user_id, amount } = req.body;
  if (!user_id || typeof amount !== 'number') return res.status(400).json({ error: 'Дұрыс дерек жоқ' });
  const balances = readBalances();
  if (!balances[user_id]) balances[user_id] = 100;
  balances[user_id] += amount;
  writeBalances(balances);
  res.json({ balance: balances[user_id] });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
