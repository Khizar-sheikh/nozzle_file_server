import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import serverlessExpress from "@vendia/serverless-express";

import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// MongoDB Setup
const uri = process.env.MONGODB_URI || "mongodb+srv://ssskhizarwaseem_db_user:QkJru84wmlLMKomn@cluster0.xbynqsk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
let db;

// Reuse MongoDB connection to avoid multiple connections in serverless
async function getDB() {
  try {
    if (!db) {
      await client.connect();
      db = client.db("nozzleDB");
      console.log("Connected to MongoDB");
    }
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// Routes
app.get("/", (req, res) => res.json({ message: "Hello from Express!" }));

app.get("/json/:file", async (req, res) => {
  try {
    const fileName = req.params.file;
    const database = await getDB();
    const doc = await database.collection("files").findOne({ name: fileName });
    if (!doc) {
      return res.status(404).json({ error: "File not found" });
    }
    const jsonStr = Buffer.from(doc.content, "base64").toString("utf-8");
    res.json(JSON.parse(jsonStr));
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/update/:file", async (req, res) => {
  try {
    const fileName = req.params.file;
    const jsonStr = JSON.stringify(req.body);
    const base64Str = Buffer.from(jsonStr, "utf-8").toString("base64");
    const database = await getDB();
    await database.collection("files").updateOne(
      { name: fileName },
      { $set: { content: base64Str } },
      { upsert: true }
    );
    res.json({ message: `${fileName} updated successfully` });
  } catch (error) {
    console.error("Error updating file:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Local dev server
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Local server running at http://localhost:${PORT}`));
}

// Vercel export
export default serverlessExpress({ app });