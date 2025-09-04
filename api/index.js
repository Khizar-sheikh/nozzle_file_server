const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const uri = process.env.MONGODB_URI ||
  "mongodb+srv://ssskhizarwaseem_db_user:QkJru84wmlLMKomn@cluster0.xbynqsk.mongodb.net/nozzleDB?retryWrites=true&w=majority";

let cachedClient = null;
let cachedDb = null;
let dbConnected = false;

// Try to connect lazily only when needed
async function getDB() {
  if (cachedDb) return cachedDb;

  try {
    if (!cachedClient) {
      console.log("🔌 Connecting to MongoDB...");
      cachedClient = new MongoClient(uri, {
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
      });
      await cachedClient.connect();
      console.log("✅ MongoDB connected");
    }

    cachedDb = cachedClient.db("nozzleDB");
    dbConnected = true;
    return cachedDb;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    dbConnected = false;
    return null; // don’t crash the app
  }
}

// ---------- Routes ----------

app.get('/', (req, res) => {
  res.type('text').send("Hello from Nozzle API 🚀");
});

// Health route (helps debug Railway)
app.get('/health', (req, res) => {
  res.json({
    status: "ok",
    db: dbConnected ? "connected" : "disconnected"
  });
});

app.get("/json/:file", async (req, res) => {
  const fileName = req.params.file;

  try {
    if (!fileName.endsWith(".json")) return res.status(400).json({ error: "Only .json files allowed" });

    const db = await getDB();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

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

    const db = await getDB();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    const base64Str = Buffer.from(JSON.stringify(req.body), "utf-8").toString("base64");
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

// ---------- Start Server ----------

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
