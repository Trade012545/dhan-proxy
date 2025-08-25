const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ⚠️ Store your Dhan credentials in environment variables (NOT hardcoded)
const ACCESS_TOKEN = process.env.DHAN_ACCESS_TOKEN;
const CLIENT_ID = process.env.DHAN_CLIENT_ID;

// Proxy endpoint for history
app.post("/dhan/intraday", async (req, res) => {
  try {
    const response = await fetch("https://api.dhan.co/v2/charts/intraday", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access-token": ACCESS_TOKEN,
        "client-id": CLIENT_ID,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Proxy request failed" });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("✅ Dhan Proxy Running");
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
