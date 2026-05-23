const baseUrl = import.meta.env.VITE_API_URL;

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

  return response.headers.get("content-type")?.includes("application/json")
    ? response.json()
    : response.text();
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
  return response.headers.get("content-type")?.includes("application/json")
    ? response.json()
    : response.text();
}

export function loadIssues() {
  return jsonRequest("/issues");
}

export function loadIssue(id) {
  return jsonRequest(`/issues/${id}`);
}

export function createIssue(payload) {
  const formData = new FormData();
  formData.append("issue_type_id", payload.issueTypeId);
  formData.append("latitude", payload.latitude);
  formData.append("longitude", payload.longitude);
  formData.append("name", payload.name);
  formData.append("description", payload.description);
  formData.append("email", payload.email);
  formData.append("turnstile_token", payload.turnstileToken);
  for (const file of payload.files) {
    formData.append("files", file);
  }

  return formRequest("/issues", formData);
}

export function createComment(issueId, payload) {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("text", payload.text);
  formData.append("turnstile_token", payload.turnstileToken);
  for (const file of payload.files) {
    formData.append("files", file);
  }

  return formRequest(`/issues/${issueId}/comments`, formData);
}

export function confirmSubscription(token) {
  return jsonRequest(`/issues/confirm-subscription`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
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
