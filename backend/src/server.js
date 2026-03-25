const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const analyzeCaseRoute = require("./routes/analyzeCase");

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "ai-legal-backend" });
});

app.post("/analyze-case", analyzeCaseRoute);

// Basic error handler so the frontend can always get JSON.
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({
    error: "Internal server error",
    details: err?.message || String(err),
  });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});

