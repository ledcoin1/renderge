const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let users = {}; // userId -> { balance: 100 }

app.post("/getBalance", (req, res) => {
  const { userId } = req.body;
  if (!users[userId]) users[userId] = { balance: 100 };
  res.json({ balance: users[userId].balance });
});

app.post("/play", (req, res) => {
  const { userId, choice, bet } = req.body;
  if (!users[userId]) users[userId] = { balance: 100 };

  if (users[userId].balance < bet) return res.json({ error: "Жеткіліксіз баланс" });

  const options = ["тас", "қағаз", "қайшы"];
  const computerChoice = options[Math.floor(Math.random() * 3)];

  let result;
  if (choice === computerChoice) result = "draw";
  else if (
    (choice === "тас" && computerChoice === "қайшы") ||
    (choice === "қағаз" && computerChoice === "тас") ||
    (choice === "қайшы" && computerChoice === "қағаз")
  ) result = "win";
  else result = "lose";

  if (result === "win") users[userId].balance += bet;
  else if (result === "lose") users[userId].balance -= bet;

  res.json({ result, computerChoice, balance: users[userId].balance });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
