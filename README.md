# AI Legal Case Reasoning Path

Legal cases are modeled as nodes and legal citations as edges. The app simulates a reasoning workflow using three classic graph traversal algorithms:

- **DFS** (Deep Legal Reasoning)
- **BFS** (Shortest Justification Path)
- **UCS** (Strongest Argument Path using weighted edges)

## Project Layout

- `frontend/` - React + Tailwind + D3 graph visualization
- `backend/` - Node.js + Express API (`POST /analyze-case`)

## Prerequisites

- Node.js (LTS recommended)

Optional:
- Set `OPENAI_API_KEY` to enable higher-quality explanations and keyword extraction. The app will fall back to a deterministic mock if the key is not present.

## Setup & Run

From the repo root (`d:\AI PROJECT`):

1. Install dependencies:
   - `npm install`
2. Start both apps:
   - `npm start`

### Ports

- Frontend (Vite): `http://localhost:3000`
- Backend (Express): `http://localhost:4000`

## Deploying to Vercel (frontend + API)

This repo can be deployed fully to Vercel without running the Express backend by using a serverless API route:
- `POST /api/analyze-case`

Implementation:
- `frontend/api/analyze-case.js`

### Vercel steps

1. Push the repo to GitHub.
2. In Vercel: **Add New Project** -> select your repo.
3. Configure:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. (Optional) Enable OpenAI enrichment:
   - Add env var `OPENAI_API_KEY`
   - The serverless function will only use OpenAI when this is present.
5. Deploy.

After deployment, Vercel will show your live website URL (the link you asked for).

## Endpoints

- `POST /analyze-case`
  - Body: `{ "problemText": string }`
  - Response: graph + algorithm paths + explanations + confidence scores

## Data

- Backend uses a small mocked legal citation dataset in:
  - `backend/src/data/legalDataset.json`

## Optional: OpenAI enrichment

If you set `backend/.env` with `OPENAI_API_KEY`, the backend will attempt to generate richer step-by-step explanations.
When not set, the app uses deterministic mock explanations.

