import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface KeywordTagsProps {
  matched: string[];
  missing: string[];
}

export default function KeywordTags({ matched, missing }: KeywordTagsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="flex items-center gap-2 font-semibold text-green-600 dark:text-green-400 mb-3">
          <Check className="w-4 h-4" /> Matched Keywords ({matched.length})
        </h4>
        <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto scrollbar-thin pr-1">
          {matched.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">No matches found yet.</p>
          )}
          {matched.map((kw, i) => (
            <motion.span
              key={kw}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
            >
              {kw}
            </motion.span>
          ))}
        </div>
      </div>
      <div>
        <h4 className="flex items-center gap-2 font-semibold text-red-600 dark:text-red-400 mb-3">
          <X className="w-4 h-4" /> Missing Keywords ({missing.length})
        </h4>
        <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto scrollbar-thin pr-1">
          {missing.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Great! Nothing major missing.</p>
          )}
          {missing.map((kw, i) => (
            <motion.span
              key={kw}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
            >
              {kw}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}
