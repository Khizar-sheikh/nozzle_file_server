import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();

// ===== Middleware =====
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ===== MongoDB Setup =====
const uri =
  "mongodb+srv://ssskhizarwaseem_db_user:QkJru84wmlLMKomn@cluster0.xbynqsk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri);
let db;

async function getDB() {
  if (!db) {
    await client.connect();
    db = client.db("nozzleDB");
  }
  return db;
}

// ---------- Routes ----------
app.get("/", (req, res) => {
  res.json({ message: "Hello from Express + MongoDB (Base64 Mode)!" });
});

app.get("/json/:file", async (req, res) => {
  const fileName = req.params.file;
  try {
    if (!fileName.endsWith(".json")) {
      return res.status(400).json({ error: "Only .json files allowed" });
    }
    const database = await getDB();
    const doc = await database.collection("files").findOne({ name: fileName });
    if (!doc) return res.status(404).json({ error: "File not found" });

    const jsonStr = Buffer.from(doc.content, "base64").toString("utf-8");
    res.json(JSON.parse(jsonStr));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/update/:file", async (req, res) => {
  const fileName = req.params.file;
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

    res.json({ message: `${fileName} updated successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
