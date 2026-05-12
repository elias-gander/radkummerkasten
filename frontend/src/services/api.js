const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function jsonRequest(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
    ...(options.body != null ? { "Content-Type": "application/json" } : {}),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
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

export function voteIssue(issueId) {
  return jsonRequest(`/issues/${issueId}/vote`, {
    method: "POST",
  });
}

export function subscribeToIssue(issueId, email, turnstileToken) {
  return jsonRequest(`/issues/${issueId}/subscribe`, {
    method: "POST",
    body: JSON.stringify({ email, turnstile_token: turnstileToken }),
  });
}
