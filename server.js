const express = require("express");
const fetch = require("node-fetch"); // v2 (Render uses Node 16 by default)
const app = express();

app.use(express.json());

// Forward any /v2/* request to Dhan API
app.use("/v2", async (req, res) => {
  const url = "https://api.dhan.co" + req.originalUrl;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "access-token": req.headers["access-token"], // pass token from client
      },
      body: req.method === "POST" ? JSON.stringify(req.body) : undefined,
    });

    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("✅ Dhan Proxy is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running at http://localhost:${PORT}`));
