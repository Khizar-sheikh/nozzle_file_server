import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
const PORT = process.env.PORT || 4000;

// ===== Middleware =====
app.use(cors());
app.use(express.json());

console.log("🚀 Server booting...");

// ===== MongoDB Setup =====
const uri =
  "mongodb+srv://ssskhizarwaseem_db_user:QkJru84wmlLMKomn@cluster0.xbynqsk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri);
let db;

async function getDB() {
  if (!db) {
    console.log("📡 Connecting to MongoDB...");
    await client.connect();
    db = client.db("nozzleDB");
    console.log("✅ Connected to database: nozzleDB");
  }
  return db;
}

// ===== Routes =====

// Root route
app.get("/", (req, res) => {
  console.log("📥 GET / hit");
  res.json({ message: "Hello from Express + MongoDB!" });
});

// Get file content
app.get("/json/:file", async (req, res) => {
  const fileName = req.params.file;
  console.log(`📥 GET /json/${fileName}`);

  try {
    if (!fileName.endsWith(".json")) {
      return res.status(400).json({ error: "Only .json files are allowed" });
    }

    const database = await getDB();
    const doc = await database.collection("files").findOne({ name: fileName });

    if (!doc) {
      return res.status(404).json({ error: "File not found" });
    }

    res.json(doc.content);
  } catch (err) {
    console.error("🔥 Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update or create file
app.post("/update/:file", async (req, res) => {
  const fileName = req.params.file;
  console.log(`📥 POST /update/${fileName}`);

  try {
    if (!fileName.endsWith(".json")) {
      return res.status(400).json({ error: "Only .json files are allowed" });
    }

    const database = await getDB();
    await database.collection("files").updateOne(
      { name: fileName },
      { $set: { content: req.body } },
      { upsert: true }
    );

    res.json({ message: `${fileName} updated successfully` });
  } catch (err) {
    console.error("🔥 Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===== Start Server (always, local + vercel dev) =====
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

// ===== Export for Vercel =====
export default app;
