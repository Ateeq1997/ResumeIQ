# ResumeIQ — AI Resume Analyzer & ATS Scoring Platform

A full-stack application that analyzes resumes against job descriptions,
calculates ATS (Applicant Tracking System) compatibility scores, visualizes
skill gaps, and provides AI-powered improvement suggestions via the Gemini API.

## Tech Stack

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS (dark/light mode)
- Framer Motion (animations)
- Recharts (radar, bar, line charts)
- React Router

**Backend**
- Python FastAPI (deployed as Vercel serverless functions via Mangum)
- Pydantic models
- PyPDF2 for PDF text extraction
- spaCy + scikit-learn for NLP / keyword extraction / TF-IDF similarity
- JSON file storage for resume history (`/tmp` on serverless)
- Google Gemini API for AI analysis (with heuristic fallback if no key set)

## Project Structure

```
resume-analyzer/
├── api/                      # FastAPI backend (Vercel serverless entry)
│   ├── index.py              # Main FastAPI app + routes
│   ├── models/
│   │   └── schemas.py        # Pydantic request/response models
│   ├── services/
│   │   └── ai_service.py     # Gemini API integration + fallback
│   ├── storage/
│   │   └── json_store.py     # JSON file-based history storage
│   └── utils/
│       ├── pdf_parser.py      # PDF text extraction
│       └── nlp_utils.py       # ATS scoring, keyword & skill matching
├── frontend/                  # React + TS + Tailwind app
│   └── src/
│       ├── components/        # Reusable UI components
│       ├── pages/              # Analyze / Dashboard / History pages
│       ├── hooks/              # useTheme (dark mode)
│       ├── lib/api.ts          # API client
│       └── types/              # Shared TypeScript types
├── requirements.txt
├── vercel.json
└── .env.example
```

## Local Development

### Backend
```bash
cd resume-analyzer
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn api.index:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api/*` requests to `http://127.0.0.1:8000`.

## Environment Variables

Copy `.env.example` to `.env` and fill in:

- `GEMINI_API_KEY` — Google Gemini API key for AI analysis (optional; falls
  back to heuristic analysis if absent)
- `GEMINI_MODEL` — Gemini model name (default `gemini-1.5-flash`)
- `FRONTEND_ORIGIN` — Allowed CORS origin in production

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import the project into Vercel.
3. Set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`, `FRONTEND_ORIGIN`)
   as Environment Variables in the Vercel project settings.
4. Vercel will use `vercel.json` to build:
   - `api/index.py` as a Python serverless function
   - `frontend/` as a static build (Vite → `dist/`)
5. Note: JSON history storage on serverless writes to `/tmp`, which is
   **ephemeral** — it resets between cold starts/deployments. For
   persistent storage, swap `api/storage/json_store.py` for a managed DB
   (e.g. Vercel Postgres, Supabase, or Vercel KV).

## Features

- 📄 Drag-and-drop PDF resume upload with text extraction
- 🎯 ATS score, keyword match %, matched/missing keyword breakdown
- 🧠 AI-powered strengths, weaknesses, suggestions, rewrite tips (Gemini)
- 📊 Skill radar chart (resume vs. job requirements) & skill distribution
- 📝 Job description comparison & keyword gap highlighting
- 📈 Dashboard with ATS trend, resume count, recent analyses
- 🕘 Resume history (JSON-backed)
- 🌗 Responsive, modern SaaS UI with dark/light mode
