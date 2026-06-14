import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, Trash2, AlertCircle } from "lucide-react";
import { Card } from "../components/Card";
import { fetchHistory, clearHistory } from "../lib/api";
import type { HistoryItem } from "../types";

function scoreColor(score: number): string {
  if (score >= 75) return "text-green-600 dark:text-green-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchHistory(50)
      .then((res) => setItems(res.items))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load history."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleClear = async () => {
    if (!confirm("Clear all resume history? This cannot be undone.")) return;
    try {
      await clearHistory();
      setItems([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear history.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold tracking-tight"
        >
          Resume History
        </motion.h1>
        {items.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-500 py-10">Loading...</p>
      ) : items.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 dark:text-gray-400 py-10">
            No resume analyses yet. Head to the Analyze page to get started.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Card className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.filename}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-center">
                    <p className={`font-bold text-lg ${scoreColor(item.ats_score)}`}>
                      {item.ats_score.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ATS</p>
                  </div>
                  <div className="text-center">
                    <p className={`font-bold text-lg ${scoreColor(item.match_percentage)}`}>
                      {item.match_percentage.toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Match</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
