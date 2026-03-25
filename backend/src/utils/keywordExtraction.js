const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "if",
  "then",
  "else",
  "for",
  "to",
  "of",
  "in",
  "on",
  "at",
  "by",
  "with",
  "from",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "it",
  "that",
  "this",
  "these",
  "those",
  "i",
  "you",
  "he",
  "she",
  "they",
  "we",
  "them",
  "us",
  "my",
  "your",
  "our",
  "their",
  "not",
  "no",
  "yes",
  "can",
  "could",
  "should",
  "would",
  "will",
  "just",
  "about",
  "into",
  "over",
  "under",
  "between",
  "within",
  "without",
  "who",
  "whom",
  "what",
  "which",
  "when",
  "where",
  "why",
  "how",
]);

const DOMAIN_HINTS = [
  { term: "contract", tags: ["contract", "agreement", "breach", "remedy"] },
  { term: "neglig", tags: ["negligence", "duty", "breach", "harm"] },
  { term: "tort", tags: ["tort", "wrongful", "liability"] },
  { term: "property", tags: ["property", "real", "possession", "trespass"] },
  { term: "copyright", tags: ["copyright", "fair use", "work"] },
  { term: "patent", tags: ["patent", "invention", "claims"] },
  { term: "trademark", tags: ["trademark", "brand", "likelihood of confusion"] },
  { term: "employment", tags: ["employment", "discrimination", "retaliation"] },
  { term: "fraud", tags: ["fraud", "misrepresentation", "reliance"] },
  { term: "defamation", tags: ["defamation", "publication", "fault"] },
];

function normalizeToken(t) {
  return t.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function tokenize(text) {
  const raw = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);
  return raw.filter((t) => !STOP_WORDS.has(t));
}

function extractDomainTerms(problemText) {
  const t = problemText.toLowerCase();
  const hits = [];
  for (const hint of DOMAIN_HINTS) {
    if (t.includes(hint.term)) hits.push(...hint.tags);
  }
  return hits;
}

function uniquePreserveOrder(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    if (!seen.has(x)) {
      out.push(x);
      seen.add(x);
    }
  }
  return out;
}

function extractKeywords(problemText) {
  const tokens = tokenize(problemText);
  const domainTerms = extractDomainTerms(problemText);

  // Prefer higher-signal phrases first, then fall back to frequent tokens.
  const freq = new Map();
  for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);

  const rankedTokens = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t);

  const combined = uniquePreserveOrder([...domainTerms, ...rankedTokens]);
  return combined.slice(0, 10);
}

module.exports = { extractKeywords };

