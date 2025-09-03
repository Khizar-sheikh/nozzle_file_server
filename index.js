import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
const PORT = process.env.PORT || 4000;

// ===== Middleware =====
app.use(cors());
app.use(express.json());

// ===== MongoDB Setup =====
const uri = "mongodb+srv://ssskhizarwaseem_db_user:QkJru84wmlLMKomn@cluster0.xbynqsk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // put your MongoDB Atlas URI in env
const client = new MongoClient(uri);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("nozzleDB"); // db name
    console.log("✅ Connected to MongoDB");
  }
}
connectDB();

// ===== Routes =====

// Serve JSON files (read from DB instead of /data folder)
app.get("/json/:file", async (req, res) => {
  try {
    const fileName = req.params.file;
    if (!fileName.endsWith(".json")) {
      return res.status(400).json({ error: "Only .json files are allowed" });
    }

    const doc = await db.collection("files").findOne({ name: fileName });
    if (!doc) {
      return res.status(404).json({ error: "File not found" });
    }

    res.json(doc.content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update or create a JSON file
app.post("/update/:file", async (req, res) => {
  try {
    const fileName = req.params.file;
    if (!fileName.endsWith(".json")) {
      return res.status(400).json({ error: "Only .json files are allowed" });
    }

    await db.collection("files").updateOne(
      { name: fileName },
      { $set: { content: req.body } },
      { upsert: true }
    );

    res.json({ message: `${fileName} updated successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Hello from Express + MongoDB on Vercel!" });
});

// ===== Start Server (local only) =====
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;
