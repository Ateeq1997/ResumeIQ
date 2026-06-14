import { motion } from "framer-motion";

interface ScoreGaugeProps {
  score: number;
  label?: string;
}

function getColor(score: number): string {
  if (score >= 75) return "#10b981"; // green
  if (score >= 50) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

export default function ScoreGauge({ score, label = "ATS Score" }: ScoreGaugeProps) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const color = getColor(clamped);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-gray-200 dark:text-gray-800"
          />
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold"
            style={{ color }}
          >
            {clamped.toFixed(0)}
          </motion.span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">/ 100</span>
        </div>
      </div>
      <p className="mt-3 font-semibold text-gray-700 dark:text-gray-300">{label}</p>
    </div>
  );
}
