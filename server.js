const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGO_URI);

const User = mongoose.model("User", {
  userId: String,
  balance: { type: Number, default: 100 }
});

// Ойыншы кіргенде — базаға сақтаймыз
app.post("/user", async (req, res) => {
  const { userId } = req.body;

  let user = await User.findOne({ userId });

  if (!user) {
    user = await User.create({ userId, balance: 100 });
  }

  res.json(user);
});

// Барлық ойыншыларды көру
app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Баланс өзгерту
app.post("/setBalance", async (req, res) => {
  const { userId, balance } = req.body;

  const user = await User.findOneAndUpdate(
    { userId },
    { balance },
    { new: true }
  );

  res.json(user);
});

app.listen(3000, () => console.log("Server running"));
