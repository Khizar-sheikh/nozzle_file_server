// api/index.js
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// ===== MongoDB Atlas Setup =====
const uri = process.env.MONGODB_URI || 
  "mongodb+srv://ssskhizarwaseem_db_user:QkJru84wmlLMKomn@cluster0.xbynqsk.mongodb.net/?retryWrites=true&w=majority";

// Global cached client and db to work in serverless
let cachedClient = null;
let cachedDb = null;

async function getDB() {
  if (cachedDb) return cachedDb;

  if (!cachedClient) {
    console.log("📡 Connecting to MongoDB...");
    cachedClient = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // optional: avoid long serverless timeout
    });
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db("nozzleDB");
  console.log("✅ Connected to database: nozzleDB");
  return cachedDb;
}

// ---------- Routes ----------

// Home route
app.get('/', (req, res) => {
  res.type('text').send("Hello");
});

// Get file content as Base64
app.get("/json/:file", async (req, res) => {
  const fileName = req.params.file;
  console.log(`📥 GET /json/${fileName}`);

  try {
    if (!fileName.endsWith(".json")) {
      return res.status(400).json({ error: "Only .json files allowed" });
    }

    const db = await getDB();
    const doc = await db.collection("files").findOne({ name: fileName });

    if (!doc) {
      console.log(`❌ Not found in DB: ${fileName}`);
      return res.status(404).json({ error: "File not found" });
    }

    // Return Base64 content directly
    res.json({ base64: doc.content });
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

    const db = await getDB();
    await db.collection("files").updateOne(
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

// For local testing only
if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => console.log('Server running on http://localhost:3000'));
}

module.exports = app;
