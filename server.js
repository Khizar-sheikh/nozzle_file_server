import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 4000;

// middlewares
app.use(cors());
app.use(express.json());

// ✅ Serve JSON files at /json/
app.use("/json", express.static(path.join(process.cwd(), "data")));

// ✅ Update a JSON file
app.post("/update/:file", (req, res) => {
  const fileName = req.params.file;

  // only allow .json
  if (!fileName.endsWith(".json")) {
    return res.status(400).json({ error: "Only .json files are allowed" });
  }

  const filePath = path.join(process.cwd(), "data", fileName);

  try {
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
    res.json({ message: `${fileName} updated successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
