import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { RadarSkill } from "../types";

interface SkillRadarChartProps {
  data: RadarSkill[];
}

export default function SkillRadarChart({ data }: SkillRadarChartProps) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
          <PolarAngleAxis
            dataKey="skill"
            tick={{ fill: "currentColor", fontSize: 11 }}
            className="text-gray-600 dark:text-gray-400"
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Radar
            name="Your Resume"
            dataKey="resume_score"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.35}
          />
          <Radar
            name="Job Requirement"
            dataKey="jd_requirement"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.2}
          />
          <Legend />
          <Tooltip
            contentStyle={{
              borderRadius: "0.75rem",
              border: "none",
              backgroundColor: "rgba(255,255,255,0.95)",
              fontSize: "0.85rem",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
