import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

console.log("🚀 Booting Express app...");

// ===== MongoDB Setup =====
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

// ---------- Routes ----------
app.get("/", (req, res) => {
  console.log("📥 GET /");
  res.json({ message: "Hello from Express + MongoDB (Base64 Mode)!" });
});

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

// ===== Local Dev Server =====
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`✅ Local server running at http://localhost:${PORT}`);
  });
}

export default app;
