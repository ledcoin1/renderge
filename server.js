const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Local JSON database file
const DB_FILE = "./db.json";

// Ensure db.json exists
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2));
}

// Helper to read database
function readDB() {
    return JSON.parse(fs.readFileSync(DB_FILE));
}

// Helper to write database
function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Test
app.get("/", (req, res) => {
    res.send("Server OK");
});

// Get user
app.get("/user/:id", (req, res) => {
    const db = readDB();
    const user = db.users[req.params.id] || null;
    res.json(user);
});

// Create or return user
app.post("/user/create", (req, res) => {
    const { id } = req.body;
    const db = readDB();

    if (!db.users[id]) {
        db.users[id] = { balance: 100 };
        writeDB(db);
    }

    res.json(db.users[id]);
});

// Update balance
app.post("/user/balance", (req, res) => {
    const { id, amount } = req.body;
    const db = readDB();

    if (!db.users[id]) {
        return res.status(400).json({ error: "User not found" });
    }

    db.users[id].balance += amount;
    writeDB(db);

    res.json(db.users[id]);
});

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
