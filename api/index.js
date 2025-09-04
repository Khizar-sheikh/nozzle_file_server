// api/index.js
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Use MongoDB URI from environment variable
const uri = process.env.MONGODB_URI ||
  "mongodb+srv://ssskhizarwaseem_db_user:QkJru84wmlLMKomn@cluster0.xbynqsk.mongodb.net/nozzleDB?retryWrites=true&w=majority";

// Cached MongoDB client for serverless
let cachedClient = null;
let cachedDb = null;

async function getDB() {
  if (cachedDb) return cachedDb;

  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000,
    });
    await cachedClient.connect();
  }

  cachedDb = cachedClient.db("nozzleDB");
  return cachedDb;
}

// ---------- Routes ----------

app.get('/', (req, res) => {
  res.type('text').send("Hello");
});

app.get("/json/:file", async (req, res) => {
  const fileName = req.params.file;

  try {
    if (!fileName.endsWith(".json")) return res.status(400).json({ error: "Only .json files allowed" });

    const db = await getDB();
    const doc = await db.collection("files").findOne({ name: fileName });

    if (!doc) return res.status(404).json({ error: "File not found" });

    res.json({ base64: doc.content });
  } catch (err) {
    console.error("Error GET /json:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/update/:file", async (req, res) => {
  const fileName = req.params.file;

  try {
    if (!fileName.endsWith(".json")) return res.status(400).json({ error: "Only .json files allowed" });

    const base64Str = Buffer.from(JSON.stringify(req.body), "utf-8").toString("base64");
    const db = await getDB();

    await db.collection("files").updateOne(
      { name: fileName },
      { $set: { content: base64Str } },
      { upsert: true }
    );

    res.json({ message: `${fileName} updated successfully` });
  } catch (err) {
    console.error("Error POST /update:", err);
    res.status(500).json({ error: err.message });
  }
});

// Railway will use this port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
