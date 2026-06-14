import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Sun, Moon, FileSearch, LayoutDashboard, History, Upload } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import clsx from "clsx";

const navItems = [
  { to: "/", label: "Analyze", icon: Upload },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/history", label: "History", icon: History },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 glass-card border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <FileSearch className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Resume<span className="text-brand-500">IQ</span>
          </span>
        </div>

        <nav className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-gray-800/60 rounded-full p-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "relative px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                  isActive
                    ? "text-white"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                )
              }
              end={item.to === "/"}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-brand-600 rounded-full"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <item.icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700" />
          )}
        </button>
      </div>

      <nav className="sm:hidden flex items-center justify-around border-t border-gray-200/60 dark:border-gray-800/60 px-2 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                isActive
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-gray-500 dark:text-gray-400"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
