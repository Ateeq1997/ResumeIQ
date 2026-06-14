"""Gemini API integration for AI-powered resume analysis."""
import os
import json
import re
import requests
from typing import Optional, Dict, Any

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)

_PROMPT_TEMPLATE = """You are an expert resume reviewer and career coach.
Analyze the following resume{jd_clause}.

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{{
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "suggestions": ["...", "..."],
  "rewrite_suggestions": ["Original: ... -> Rewrite: ...", "..."],
  "summary": "A 2-3 sentence overall summary of the resume quality."
}}

Provide 3-5 items per list. Be specific and actionable.

RESUME TEXT:
{resume_text}
{jd_section}
"""


def _build_prompt(resume_text: str, jd_text: str = "") -> str:
    jd_clause = " against the provided job description" if jd_text.strip() else ""
    jd_section = f"\nJOB DESCRIPTION:\n{jd_text}\n" if jd_text.strip() else ""
    # Truncate to keep request size reasonable
    resume_text = resume_text[:6000]
    jd_text_trunc = jd_text[:3000]
    return _PROMPT_TEMPLATE.format(
        jd_clause=jd_clause,
        resume_text=resume_text,
        jd_section=(f"\nJOB DESCRIPTION:\n{jd_text_trunc}\n" if jd_text.strip() else ""),
    )


def _extract_json(text: str) -> Optional[Dict[str, Any]]:
    """Extract JSON object from model output, stripping code fences if present."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?", "", text)
    text = re.sub(r"```$", "", text)
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return None
    return None


def analyze_resume_with_ai(resume_text: str, jd_text: str = "") -> Dict[str, Any]:
    """
    Call Gemini API to get AI-driven resume analysis.
    Falls back to a heuristic response if no API key is configured or call fails.
    """
    if not GEMINI_API_KEY:
        return _fallback_analysis(resume_text, jd_text)

    prompt = _build_prompt(resume_text, jd_text)
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1024,
        },
    }

    try:
        resp = requests.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            json=payload,
            timeout=25,
        )
        resp.raise_for_status()
        data = resp.json()
        text = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        )
        parsed = _extract_json(text)
        if parsed:
            return {
                "strengths": parsed.get("strengths", []),
                "weaknesses": parsed.get("weaknesses", []),
                "suggestions": parsed.get("suggestions", []),
                "rewrite_suggestions": parsed.get("rewrite_suggestions", []),
                "summary": parsed.get("summary"),
            }
        return _fallback_analysis(resume_text, jd_text)
    except Exception:
        return _fallback_analysis(resume_text, jd_text)


def _fallback_analysis(resume_text: str, jd_text: str = "") -> Dict[str, Any]:
    """Heuristic-based analysis used when Gemini API is unavailable."""
    word_count = len(resume_text.split())
    strengths = []
    weaknesses = []
    suggestions = []

    if word_count > 200:
        strengths.append("Resume has substantial detail and content.")
    else:
        weaknesses.append("Resume content seems brief; consider adding more detail on accomplishments.")

    if re.search(r"\b(led|managed|built|developed|designed|implemented)\b", resume_text, re.I):
        strengths.append("Uses strong action verbs to describe experience.")
    else:
        suggestions.append("Start bullet points with strong action verbs (e.g., 'Led', 'Built', 'Implemented').")

    if re.search(r"\b\d+%|\$\d+|\b\d+x\b", resume_text):
        strengths.append("Includes quantifiable metrics and results.")
    else:
        suggestions.append("Add quantifiable metrics (%, $, numbers) to demonstrate impact.")

    if not re.search(r"summary|objective", resume_text, re.I):
        weaknesses.append("No clear professional summary or objective section detected.")
        suggestions.append("Add a concise professional summary at the top of your resume.")

    rewrite_suggestions = [
        "Original: 'Responsible for managing team' -> Rewrite: 'Led a cross-functional team of 8, "
        "improving delivery speed by 30%'",
        "Original: 'Worked on backend development' -> Rewrite: 'Built and optimized REST APIs "
        "serving 10K+ daily requests using FastAPI'",
    ]

    if not strengths:
        strengths.append("Resume successfully parsed and contains relevant content.")
    if not weaknesses:
        weaknesses.append("No major issues detected; consider tailoring further to the target role.")
    if not suggestions:
        suggestions.append("Tailor keywords to closely match the target job description.")

    summary = (
        "This resume contains a reasonable foundation. AI-powered analysis is using a "
        "heuristic fallback because no Gemini API key is configured — set GEMINI_API_KEY "
        "for deeper AI insights."
    )

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": suggestions,
        "rewrite_suggestions": rewrite_suggestions,
        "summary": summary,
    }
