import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 4000;

// ===== Middleware =====
app.use(cors());
app.use(express.json({ limit: "5mb" }));

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

    // Seed files into MongoDB on first connect
    await seedInitialFiles(db);
  }
  return db;
}

// ===== Seed initial files =====
async function seedInitialFiles(database) {
  const seedFiles = [
    "lists.json",
    "volume.json",
    "abconstant.json",
    "spray-quality-formatted.json",
    "nozzle-quality-mixture.json",
  ];

  for (const file of seedFiles) {
    const filePath = path.join(process.cwd(), "data", file);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File missing in /data: ${file}`);
      continue;
    }

    const existing = await database.collection("files").findOne({ name: file });
    if (existing) {
      console.log(`➡️ ${file} already exists in DB, skipping`);
      continue;
    }

    const jsonStr = fs.readFileSync(filePath, "utf-8");
    const base64Str = Buffer.from(jsonStr, "utf-8").toString("base64");

    await database.collection("files").insertOne({
      name: file,
      content: base64Str,
    });

    console.log(`✅ Seeded ${file} into DB`);
  }
}

// ===== Routes =====

// Root route
app.get("/", (req, res) => {
  console.log("📥 GET / hit");
  res.json({ message: "Hello from Express + MongoDB (Base64 Mode)!" });
});

// Get file content (decode base64 → JSON)
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

    const jsonStr = Buffer.from(doc.content, "base64").toString("utf-8");
    const jsonObj = JSON.parse(jsonStr);

    res.json(jsonObj);
  } catch (err) {
    console.error("🔥 Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update or create file (encode JSON → Base64)
app.post("/update/:file", async (req, res) => {
  const fileName = req.params.file;
  console.log(`📥 POST /update/${fileName}`);

  try {
    if (!fileName.endsWith(".json")) {
      return res.status(400).json({ error: "Only .json files are allowed" });
    }

    const jsonStr = JSON.stringify(req.body);
    const base64Str = Buffer.from(jsonStr, "utf-8").toString("base64");

    const database = await getDB();
    await database.collection("files").updateOne(
      { name: fileName },
      { $set: { content: base64Str } },
      { upsert: true }
    );

    res.json({ message: `${fileName} updated successfully` });
  } catch (err) {
    console.error("🔥 Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

export default app;
