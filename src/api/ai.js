const BASE_URL = "http://localhost:3000/api/ai";

export async function analyzeJD(jobDescription) {
  const res = await fetch(`${BASE_URL}/analyze-jd`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobDescription }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) throw new Error("Session expired. Please log in again.");
    throw new Error(data.message || data.error || `Request failed (${res.status})`);
  }
  return data;
}
