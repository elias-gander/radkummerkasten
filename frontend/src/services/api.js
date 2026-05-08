const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function jsonRequest(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || response.statusText);
  }
  return response.json();
}

async function formRequest(path, formData) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || response.statusText);
  }
  return response.json();
}

export function loadIssues() {
  return jsonRequest("/issues");
}

export function loadIssue(id) {
  return jsonRequest(`/issues/${id}`);
}

export function createIssue(payload) {
  return jsonRequest("/issues", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createComment(issueId, payload) {
  return jsonRequest(`/issues/${issueId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function verifyToken(token) {
  return jsonRequest("/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  return formRequest("/upload", formData);
}
