import { motion } from "framer-motion";
import { Sparkles, ThumbsUp, AlertTriangle, Lightbulb, PenLine } from "lucide-react";
import type { AIAnalysis } from "../types";

interface AIInsightsPanelProps {
  analysis: AIAnalysis;
}

const sections = [
  { key: "strengths", title: "Strengths", icon: ThumbsUp, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20" },
  { key: "weaknesses", title: "Weaknesses", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  { key: "suggestions", title: "Improvement Suggestions", icon: Lightbulb, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { key: "rewrite_suggestions", title: "Rewrite Suggestions", icon: PenLine, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
] as const;

export default function AIInsightsPanel({ analysis }: AIInsightsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-brand-500" />
        <h3 className="text-lg font-bold">AI-Powered Analysis</h3>
      </div>

      {analysis.summary && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-900/40 text-sm leading-relaxed"
        >
          {analysis.summary}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section, idx) => {
          const items = analysis[section.key] as string[];
          if (!items || items.length === 0) return null;
          return (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`rounded-xl p-4 ${section.bg} border border-gray-100 dark:border-gray-800`}
            >
              <h4 className={`flex items-center gap-2 font-semibold mb-2 ${section.color}`}>
                <section.icon className="w-4 h-4" /> {section.title}
              </h4>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-50" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
