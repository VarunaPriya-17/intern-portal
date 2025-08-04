// --------------------------
// 📁 server.js (backend file)
// --------------------------
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1:27017/internPortal", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, unique: true }
});
const User = mongoose.model("User", UserSchema);

// Donation Schema
const DonationSchema = new mongoose.Schema({
  name: String,
  amount: Number,
  createdAt: { type: Date, default: Date.now }
});
const Donation = mongoose.model("Donation", DonationSchema);

// Save user (on login)
app.post("/api/user", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });

  try {
    const existing = await User.findOne({ name });
    if (!existing) await User.create({ name });
    res.json({ message: "User saved" });
  } catch (err) {
    res.status(500).json({ error: "Error saving user" });
  }
});

// Save donation
app.post("/api/donate", async (req, res) => {
  const { name, amount } = req.body;
  if (!name || !amount) return res.status(400).json({ error: "Missing fields" });

  try {
    await Donation.create({ name, amount });
    res.json({ message: "Donation saved" });
  } catch (err) {
    res.status(500).json({ error: "Error saving donation" });
  }
});

app.get("/api/donations/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const result = await Donation.aggregate([
      { $match: { name } },
      {
        $group: {
          _id: "$name",
          total: { $sum: "$amount" }
        }
      }
    ]);

    const total = result.length > 0 ? result[0].total : 0;
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch total" });
  }
});

// Leaderboard
app.get("/api/leaderboard", async (req, res) => {
  try {
    const donations = await Donation.aggregate([
      {
        $group: {
          _id: "$name",
          totalDonated: { $sum: "$amount" }
        }
      },
      { $sort: { totalDonated: -1 } }
    ]);

    res.json(donations.map(d => ({
      name: d._id,
      donations: d.totalDonated
    })));
  } catch (err) {
    res.status(500).json({ error: "Error fetching leaderboard" });
  }
});

app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
