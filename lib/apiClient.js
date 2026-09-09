"use client";

/**
 * API Client per Widow Blue Backend (FastAPI Python)
 * Base URL configurable via env var NEXT_PUBLIC_API_URL
 * Fallback a http://localhost:8000 per sviluppo
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Headers base per tutte le richieste
function getHeaders(token = null) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Funzione generica per fetch con error handling
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const options = {
      method,
      headers: getHeaders(token),
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);

    // Se 401, token scaduto/invalido
    if (response.status === 401) {
      return { ok: false, offline: false, error: "Unauthorized - token scaduto" };
    }

    const json = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        offline: false,
        error: json.detail || json.error || response.statusText,
        data: json,
      };
    }

    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, offline: true, error: String(e) };
  }
}

// === Health Check ===
export async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      return data.status === "ok";
    }
    return false;
  } catch (e) {
    return false;
  }
}

// === Authentication ===
export async function loginOrRegister(email, password, phone) {
  // Prova login
  const loginRes = await apiCall("POST", "/auth/login", { email, password });
  if (loginRes.ok) {
    return loginRes;
  }

  // Se login fallisce, prova registrazione
  const registerRes = await apiCall("POST", "/auth/register", {
    email,
    password,
    phone,
  });

  return registerRes;
}

export async function apiGetMe(token) {
  return apiCall("GET", "/auth/me", null, token);
}

// === 2FA / TOTP ===
export async function apiSetup2FA(token) {
  return apiCall("POST", "/auth/2fa/setup", {}, token);
}

export async function apiVerify2FA(token, code) {
  return apiCall("POST", "/auth/2fa/verify", { code }, token);
}

// === Contacts ===
export async function apiGetContacts(token) {
  return apiCall("GET", "/chat/contacts", null, token);
}

export async function apiAddContacts(token, contacts) {
  return apiCall("POST", "/chat/contacts/batch", { contacts }, token);
}

export async function apiCreateContact(token, contact) {
  return apiCall("POST", "/chat/contacts", contact, token);
}

// === Messages ===
export async function apiGetMessages(token, contactId) {
  return apiCall("GET", `/chat/messages/${contactId}`, null, token);
}

export async function apiSendMessage(token, contactId, text) {
  return apiCall("POST", `/chat/messages/${contactId}/send`, { text }, token);
}

// === Rewards ===
export async function apiSubmitSteps(token, steps) {
  return apiCall("POST", "/rewards/submit-steps", { steps }, token);
}

export async function apiGetRewards(token) {
  return apiCall("GET", "/rewards/user-rewards", null, token);
}

// === Message Stream (SSE) ===
export function openMessageStream(token, contactId, onMessage) {
  try {
    const eventSource = new EventSource(
      `${API_URL}/chat/messages/${contactId}/stream?token=${token}`
    );

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage(message);
      } catch (e) {
        console.error("Error parsing message:", e);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  } catch (e) {
    console.error("Error opening stream:", e);
    return () => {};
  }
}
