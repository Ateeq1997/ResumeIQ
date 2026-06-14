from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class SkillMatch(BaseModel):
    skill: str
    found_in_resume: bool
    found_in_jd: bool


class ATSResult(BaseModel):
    ats_score: float
    match_percentage: float
    matched_keywords: List[str]
    missing_keywords: List[str]
    total_jd_keywords: int
    total_matched: int


class SkillDistribution(BaseModel):
    category: str
    count: int


class RadarSkill(BaseModel):
    skill: str
    resume_score: float
    jd_requirement: float


class AIAnalysis(BaseModel):
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    rewrite_suggestions: List[str] = Field(default_factory=list)
    summary: Optional[str] = None


class AnalyzeResponse(BaseModel):
    id: str
    filename: str
    created_at: str
    resume_text_preview: str
    ats_result: ATSResult
    skill_distribution: List[SkillDistribution]
    radar_chart: List[RadarSkill]
    ai_analysis: Optional[AIAnalysis] = None


class HistoryItem(BaseModel):
    id: str
    filename: str
    created_at: str
    ats_score: float
    match_percentage: float


class HistoryResponse(BaseModel):
    items: List[HistoryItem]
    total: int


class DashboardStats(BaseModel):
    total_resumes: int
    average_ats_score: float
    ats_trend: List[dict]
    recent_analyses: List[HistoryItem]


class AnalyzeRequest(BaseModel):
    job_description: str = ""


class ErrorResponse(BaseModel):
    detail: str
