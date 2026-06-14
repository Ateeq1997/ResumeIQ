import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import AnalyzePage from "./pages/AnalyzePage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<AnalyzePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-gray-400 dark:text-gray-600 py-6">
        ResumeIQ — AI Resume Analyzer & ATS Scoring Platform
      </footer>
    </div>
  );
}
