"""Main FastAPI application for AI Resume Analyzer / ATS Scoring Platform."""
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
try:
    from mangum import Mangum
except ImportError:
    Mangum = None

from api.models.schemas import (
    AnalyzeResponse,
    ATSResult,
    HistoryResponse,
    HistoryItem,
    DashboardStats,
)
from api.utils.pdf_parser import extract_text_from_pdf, clean_text
from api.utils.nlp_utils import (
    calculate_ats_score,
    build_skill_distribution,
    build_radar_chart,
)
from api.services.ai_service import analyze_resume_with_ai
from api.storage.json_store import add_history_entry, get_history

app = FastAPI(title="AI Resume Analyzer API", version="1.0.0")

FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if FRONTEND_ORIGIN == "*" else [FRONTEND_ORIGIN, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "resume-analyzer-api"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: Optional[str] = Form(default=""),
    use_ai: Optional[bool] = Form(default=True),
):
    """
    Upload a resume PDF, optionally compare against a job description,
    and return ATS scoring, skill charts, and AI analysis.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        file_bytes = await file.read()
        raw_text = extract_text_from_pdf(file_bytes)
        resume_text = clean_text(raw_text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")

    if not resume_text or len(resume_text) < 20:
        raise HTTPException(
            status_code=400,
            detail="Could not extract readable text from the PDF. "
                   "Please upload a text-based (not scanned) PDF.",
        )

    jd_text = (job_description or "").strip()

    ats_dict, matched, missing = calculate_ats_score(resume_text, jd_text)
    skill_distribution = build_skill_distribution(resume_text)
    radar_chart = build_radar_chart(resume_text, jd_text)

    ai_analysis = None
    if use_ai:
        ai_analysis = analyze_resume_with_ai(resume_text, jd_text)

    record_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    response = AnalyzeResponse(
        id=record_id,
        filename=file.filename,
        created_at=created_at,
        resume_text_preview=resume_text[:500],
        ats_result=ATSResult(**ats_dict),
        skill_distribution=skill_distribution,
        radar_chart=radar_chart,
        ai_analysis=ai_analysis,
    )

    # Persist to history
    add_history_entry({
        "id": record_id,
        "created_at": created_at,
        "filename": file.filename,
        "ats_score": ats_dict["ats_score"],
        "match_percentage": ats_dict["match_percentage"],
        "skill_distribution": skill_distribution,
        "radar_chart": radar_chart,
        "ai_analysis": ai_analysis,
        "matched_keywords": matched[:20],
        "missing_keywords": missing[:20],
        "resume_text_preview": resume_text[:500],
    })

    return response


@app.get("/api/history", response_model=HistoryResponse)
def get_resume_history(limit: int = 50):
    """Return resume analysis history (most recent first)."""
    items = get_history(limit=limit)
    history_items = [
        HistoryItem(
            id=item["id"],
            filename=item["filename"],
            created_at=item["created_at"],
            ats_score=item["ats_score"],
            match_percentage=item["match_percentage"],
        )
        for item in items
    ]
    return HistoryResponse(items=history_items, total=len(history_items))


@app.get("/api/history/{item_id}")
def get_history_detail(item_id: str):
    """Return full detail for a single history record."""
    from api.storage.json_store import get_history_item
    item = get_history_item(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="History item not found.")
    return item


@app.get("/api/dashboard", response_model=DashboardStats)
def get_dashboard():
    """Return aggregated dashboard statistics."""
    items = get_history(limit=100)

    total = len(items)
    avg_score = round(sum(i["ats_score"] for i in items) / total, 2) if total else 0.0

    # Trend: chronological order (oldest -> newest), last 20
    trend_items = list(reversed(items))[-20:]
    ats_trend = [
        {
            "date": i["created_at"][:10],
            "ats_score": i["ats_score"],
            "match_percentage": i["match_percentage"],
        }
        for i in trend_items
    ]

    recent = [
        HistoryItem(
            id=i["id"],
            filename=i["filename"],
            created_at=i["created_at"],
            ats_score=i["ats_score"],
            match_percentage=i["match_percentage"],
        )
        for i in items[:5]
    ]

    return DashboardStats(
        total_resumes=total,
        average_ats_score=avg_score,
        ats_trend=ats_trend,
        recent_analyses=recent,
    )


@app.delete("/api/history")
def clear_resume_history():
    """Clear all stored history records."""
    from api.storage.json_store import clear_history
    clear_history()
    return {"status": "cleared"}


# Vercel serverless entrypoint (Mangum wraps the ASGI app for AWS-Lambda-style handlers)
handler = Mangum(app) if Mangum else None
