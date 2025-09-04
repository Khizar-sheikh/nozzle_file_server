const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

console.log("✅ App file loaded, starting setup...");

const app = express();
app.use(express.json());
app.use(cors());

console.log("⚙️ Middleware configured (JSON, CORS)");

const uri = process.env.MONGODB_URI ||
  "mongodb+srv://ssskhizarwaseem_db_user:QkJru84wmlLMKomn@cluster0.xbynqsk.mongodb.net/nozzleDB?retryWrites=true&w=majority";

let cachedClient = null;
let cachedDb = null;
let dbConnected = false;

// Try to connect lazily only when needed
async function getDB() {
  if (cachedDb) {
    console.log("📂 Returning cached DB connection");
    return cachedDb;
  }

  try {
    if (!cachedClient) {
      console.log("🔌 Attempting MongoDB connection...");
      cachedClient = new MongoClient(uri, {
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
      });
      await cachedClient.connect();
      console.log("✅ MongoDB connected successfully");
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
  console.log("➡️ GET / called");
  res.type('text').send("Hello from Nozzle API 🚀");
});

// Health route (helps debug Railway)
app.get('/health', async (req, res) => {
  console.log("➡️ GET /health called");
  try {
    const db = await getDB();
    if (!db) {
      console.log("⚠️ Health check: DB not connected");
      return res.status(503).json({ status: "error", db: "disconnected" });
    }

    await db.command({ ping: 1 }); // Mongo ping
    console.log("✅ Health check passed");
    res.status(200).json({ status: "ok", db: "connected" });
  } catch (err) {
    console.error("❌ Health check failed:", err.message);
    res.status(500).json({ status: "error", db: "disconnected", error: err.message });
  }
});

app.get("/json/:file", async (req, res) => {
  const fileName = req.params.file;
  console.log(`➡️ GET /json/${fileName} called`);

  try {
    if (!fileName.endsWith(".json")) {
      console.log("⚠️ Invalid file extension");
      return res.status(400).json({ error: "Only .json files allowed" });
    }

    const db = await getDB();
    if (!db) {
      console.log("⚠️ DB unavailable for /json route");
      return res.status(503).json({ error: "Database unavailable" });
    }

    const doc = await db.collection("files").findOne({ name: fileName });
    if (!doc) {
      console.log("⚠️ File not found in DB");
      return res.status(404).json({ error: "File not found" });
    }

    console.log(`✅ File ${fileName} retrieved`);
    res.json({ base64: doc.content });
  } catch (err) {
    console.error("❌ Error GET /json:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/update/:file", async (req, res) => {
  const fileName = req.params.file;
  console.log(`➡️ POST /update/${fileName} called`);

  try {
    if (!fileName.endsWith(".json")) {
      console.log("⚠️ Invalid file extension");
      return res.status(400).json({ error: "Only .json files allowed" });
    }

    const db = await getDB();
    if (!db) {
      console.log("⚠️ DB unavailable for update route");
      return res.status(503).json({ error: "Database unavailable" });
    }

    const base64Str = Buffer.from(JSON.stringify(req.body), "utf-8").toString("base64");
    await db.collection("files").updateOne(
      { name: fileName },
      { $set: { content: base64Str } },
      { upsert: true }
    );

    console.log(`✅ File ${fileName} updated successfully`);
    res.json({ message: `${fileName} updated successfully` });
  } catch (err) {
    console.error("❌ Error POST /update:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Start Server ----------

const PORT = process.env.PORT || 3000;
console.log(`👉 About to start server on port ${PORT}`);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
