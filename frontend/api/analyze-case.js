// Vercel serverless function:
// Route: POST /api/analyze-case
// This reuses the backend's mock dataset + DFS/BFS/UCS logic.

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { analyzeCase } = require("../../backend/src/controllers/analyzeCaseController");

function parseBody(req) {
  if (!req) return {};
  if (typeof req.body === "object" && req.body !== null) return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

export default async function handler(req, res) {
  // Basic CORS (safe for same-origin; helps during local/testing).
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = parseBody(req);
  const problemText = String(body?.problemText || "").trim();

  if (problemText.length < 3 || problemText.length > 5000) {
    res.status(400).json({ error: "problemText must be between 3 and 5000 characters" });
    return;
  }

  try {
    const result = await analyzeCase(problemText);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      error: "Internal server error",
      details: err?.message || String(err),
    });
  }
}

