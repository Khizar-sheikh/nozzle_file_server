// api/index.js
const express = require('express');
const path = require('path');
const { MongoClient } = require("mongodb");

const app = express();


// Home route - HTML
app.get('/', (req, res) => {
  res.type('html').send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>Express on Vercel</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/api-data">API Data</a>
          <a href="/healthz">Health</a>
        </nav>
        <h1>Welcome to Express on Vercel 🚀</h1>
        <p>This is a minimal example without a database or forms.</p>
        <img src="/logo.png" alt="Logo" width="120" />
      </body>
    </html>
  `);
});


const uri =
  "mongodb+srv://ssskhizarwaseem_db_user:QkJru84wmlLMKomn@cluster0.xbynqsk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri);
let db;

// ---------- Database Helper ----------
async function getDB() {
  if (!db) {
    console.log("📡 Connecting to MongoDB...");
    await client.connect();
    db = client.db("nozzleDB");
    console.log("✅ Connected to database: nozzleDB");
  }
  return db;
}


// Get file content
app.get("/json/:file", async (req, res) => {
  const fileName = req.params.file;
  console.log(`📥 GET /json/${fileName}`);

  try {
    if (!fileName.endsWith(".json")) {
      return res.status(400).json({ error: "Only .json files allowed" });
    }

    const database = await getDB();
    const doc = await database.collection("files").findOne({ name: fileName });

    if (!doc) {
      console.log(`❌ Not found in DB: ${fileName}`);
      return res.status(404).json({ error: "File not found" });
    }

    const jsonStr = Buffer.from(doc.content, "base64").toString("utf-8");
    res.json(JSON.parse(jsonStr));
  } catch (err) {
    console.error("🔥 Error GET /json:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update or create file
app.post("/update/:file", async (req, res) => {
  const fileName = req.params.file;
  console.log(`📥 POST /update/${fileName}`);

  try {
    if (!fileName.endsWith(".json")) {
      return res.status(400).json({ error: "Only .json files allowed" });
    }

    const jsonStr = JSON.stringify(req.body);
    const base64Str = Buffer.from(jsonStr, "utf-8").toString("base64");

    const database = await getDB();
    await database.collection("files").updateOne(
      { name: fileName },
      { $set: { content: base64Str } },
      { upsert: true }
    );

    console.log(`✅ Updated: ${fileName}`);
    res.json({ message: `${fileName} updated successfully` });
  } catch (err) {
    console.error("🔥 Error POST /update:", err.message);
    res.status(500).json({ error: err.message });
  }
});
// Health check
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Local dev listener (ignored on Vercel)
app.listen(3000, () => console.log('Server running on http://localhost:3000'));

module.exports = app;