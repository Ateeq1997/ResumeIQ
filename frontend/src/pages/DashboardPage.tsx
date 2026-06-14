import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { FileText, TrendingUp, Target, Clock } from "lucide-react";
import { Card, StatCard } from "../components/Card";
import { fetchDashboard } from "../lib/api";
import type { DashboardStats } from "../types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard()
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-red-500">
        {error || "No data available."}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-extrabold tracking-tight"
      >
        Dashboard
      </motion.h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Resumes Analyzed"
          value={stats.total_resumes}
          icon={FileText}
          accent="text-brand-500"
          delay={0.05}
        />
        <StatCard
          label="Average ATS Score"
          value={`${stats.average_ats_score.toFixed(1)}`}
          icon={Target}
          accent="text-green-500"
          delay={0.1}
        />
        <StatCard
          label="Best Score"
          value={
            stats.recent_analyses.length
              ? Math.max(...stats.recent_analyses.map((a) => a.ats_score)).toFixed(1)
              : "—"
          }
          icon={TrendingUp}
          accent="text-purple-500"
          delay={0.15}
        />
        <StatCard
          label="Last Analyzed"
          value={
            stats.recent_analyses.length
              ? new Date(stats.recent_analyses[0].created_at).toLocaleDateString()
              : "—"
          }
          icon={Clock}
          accent="text-amber-500"
          delay={0.2}
        />
      </div>

      <Card delay={0.25}>
        <h3 className="font-semibold mb-4">ATS Score Trend</h3>
        {stats.ats_trend.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-10 text-center">
            No analysis history yet. Upload a resume to get started.
          </p>
        ) : (
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.ats_trend}>
                <CartesianGrid strokeDasharray="3 3" className="text-gray-200 dark:text-gray-700" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "none",
                    backgroundColor: "rgba(255,255,255,0.95)",
                    fontSize: "0.85rem",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ats_score"
                  name="ATS Score"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="match_percentage"
                  name="Match %"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card delay={0.3}>
        <h3 className="font-semibold mb-4">Recent Analyses</h3>
        {stats.recent_analyses.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
            Nothing here yet.
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {stats.recent_analyses.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.filename}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-brand-600 dark:text-brand-400">
                    {item.ats_score.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">ATS Score</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
