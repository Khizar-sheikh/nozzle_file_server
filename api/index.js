// api/index.js
const express = require('express');
const { MongoClient } = require("mongodb");

const app = express();

app.use(express.json());
const cors = require('cors');
app.use(cors());

// Home route - HTML
app.get('/', (req, res) => {
  res.type('text').send("Hello");
});



const uri =
  "mongodb+srv://ssskhizarwaseem_db_user:QkJru84wmlLMKomn@cluster0.xbynqsk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  tls: true,
  tlsAllowInvalidCertificates: false
});

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

// Local dev listener (ignored on Vercel)
app.listen(3000, () => console.log('Server running on http://localhost:3000'));

module.exports = app;