import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function Card({ children, className, delay = 0 }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={clsx(
        "rounded-2xl p-6 glass-card",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: string;
  delay?: number;
}

export function StatCard({ label, value, icon: Icon, accent = "text-brand-500", delay = 0 }: StatCardProps) {
  return (
    <Card delay={delay} className="flex items-center gap-4">
      <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800", accent)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </Card>
  );
}
