import type {
  AnalyzeResponse,
  HistoryResponse,
  DashboardStats,
} from "../types";

const API_BASE = "/api";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = "Request failed";
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function analyzeResume(
  file: File,
  jobDescription: string,
  useAI: boolean = true
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("job_description", jobDescription);
  formData.append("use_ai", String(useAI));

  const res = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<AnalyzeResponse>(res);
}

export async function fetchHistory(limit = 50): Promise<HistoryResponse> {
  const res = await fetch(`${API_BASE}/history?limit=${limit}`);
  return handleResponse<HistoryResponse>(res);
}

export async function fetchHistoryDetail(id: string): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/history/${id}`);
  return handleResponse<AnalyzeResponse>(res);
}

export async function fetchDashboard(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/dashboard`);
  return handleResponse<DashboardStats>(res);
}

export async function clearHistory(): Promise<void> {
  const res = await fetch(`${API_BASE}/history`, { method: "DELETE" });
  await handleResponse(res);
}
