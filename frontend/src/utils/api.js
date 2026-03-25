export function getBackendUrl() {
  // Vite exposes env vars prefixed with VITE_
  // eslint-disable-next-line no-undef
  return import.meta?.env?.VITE_BACKEND_URL || "";
}

export async function analyzeCase({ problemText }) {
  const backendUrl = getBackendUrl();
  const endpoint = backendUrl ? `${backendUrl}/analyze-case` : "/api/analyze-case";

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ problemText }),
  });

  if (!resp.ok) {
    let details = "";
    try {
      details = (await resp.json())?.error || (await resp.text());
    } catch {
      // ignore
    }
    throw new Error(`Backend error (${resp.status}): ${details}`);
  }

  return resp.json();
}

