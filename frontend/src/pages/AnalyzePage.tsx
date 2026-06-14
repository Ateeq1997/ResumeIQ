import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ClipboardList, AlertCircle, BarChart3 } from "lucide-react";
import ResumeUpload from "../components/ResumeUpload";
import ScoreGauge from "../components/ScoreGauge";
import SkillRadarChart from "../components/SkillRadarChart";
import SkillDistributionChart from "../components/SkillDistributionChart";
import KeywordTags from "../components/KeywordTags";
import AIInsightsPanel from "../components/AIInsightsPanel";
import { Card } from "../components/Card";
import { analyzeResume } from "../lib/api";
import type { AnalyzeResponse } from "../types";

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const response = await analyzeResume(file, jobDescription, true);
      setResult(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [file, jobDescription]);

  const handleClear = useCallback(() => {
    setFile(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          AI Resume Analyzer & <span className="text-brand-500">ATS Score</span> Checker
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Upload your resume, paste a job description, and get instant ATS scoring,
          keyword matching, and AI-powered improvement suggestions.
        </p>
      </motion.div>

      {/* Upload + JD input */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card delay={0.05}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-brand-500" /> Upload Resume
          </h3>
          <ResumeUpload
            selectedFile={file}
            onFileSelected={setFile}
            onClear={handleClear}
            loading={loading}
          />
        </Card>

        <Card delay={0.1}>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-500" /> Job Description (optional)
          </h3>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here to compare your resume against it..."
            className="w-full h-40 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
          <p className="text-xs text-gray-400 mt-2">
            Without a job description, ATS score is calculated against a general skill taxonomy.
          </p>
        </Card>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleAnalyze}
          disabled={!file || loading}
          className="px-8 py-3 rounded-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold shadow-lg shadow-brand-500/30 transition-all flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          {loading ? "Analyzing..." : "Analyze Resume"}
        </button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 justify-center text-red-500 text-sm"
        >
          <AlertCircle className="w-4 h-4" /> {error}
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="flex items-center justify-center">
                <ScoreGauge score={result.ats_result.ats_score} label="ATS Score" />
              </Card>
              <Card className="flex items-center justify-center">
                <ScoreGauge
                  score={result.ats_result.match_percentage}
                  label="Keyword Match %"
                />
              </Card>
              <Card>
                <h4 className="font-semibold mb-3">Summary</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>
                    <span className="font-medium">{result.ats_result.total_matched}</span> of{" "}
                    <span className="font-medium">{result.ats_result.total_jd_keywords}</span> keywords matched
                  </li>
                  <li>
                    File: <span className="font-medium">{result.filename}</span>
                  </li>
                  <li>
                    Analyzed: {new Date(result.created_at).toLocaleString()}
                  </li>
                </ul>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card delay={0.1}>
                <h4 className="font-semibold mb-3">Skill Radar — Resume vs Job</h4>
                <SkillRadarChart data={result.radar_chart} />
              </Card>
              <Card delay={0.15}>
                <h4 className="font-semibold mb-3">Skill Distribution</h4>
                <SkillDistributionChart data={result.skill_distribution} />
              </Card>
            </div>

            <Card delay={0.2}>
              <h4 className="font-semibold mb-4">Keyword Analysis</h4>
              <KeywordTags
                matched={result.ats_result.matched_keywords}
                missing={result.ats_result.missing_keywords}
              />
            </Card>

            {result.ai_analysis && (
              <Card delay={0.25}>
                <AIInsightsPanel analysis={result.ai_analysis} />
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
