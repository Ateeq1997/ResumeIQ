export interface ATSResult {
  ats_score: number;
  match_percentage: number;
  matched_keywords: string[];
  missing_keywords: string[];
  total_jd_keywords: number;
  total_matched: number;
}

export interface SkillDistribution {
  category: string;
  count: number;
}

export interface RadarSkill {
  skill: string;
  resume_score: number;
  jd_requirement: number;
}

export interface AIAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  rewrite_suggestions: string[];
  summary?: string;
}

export interface AnalyzeResponse {
  id: string;
  filename: string;
  created_at: string;
  resume_text_preview: string;
  ats_result: ATSResult;
  skill_distribution: SkillDistribution[];
  radar_chart: RadarSkill[];
  ai_analysis?: AIAnalysis;
}

export interface HistoryItem {
  id: string;
  filename: string;
  created_at: string;
  ats_score: number;
  match_percentage: number;
}

export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
}

export interface DashboardStats {
  total_resumes: number;
  average_ats_score: number;
  ats_trend: { date: string; ats_score: number; match_percentage: number }[];
  recent_analyses: HistoryItem[];
}
