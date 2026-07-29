"use client";

/**
 * Client per le API reali. Ogni funzione ritorna sempre {ok, data|error, offline}
 * cosi' la UI puo' gestire in modo uniforme sia gli errori applicativi (es.
 * password sbagliata) sia il caso "il backend non risponde" — che non e' un
 * errore fatale qui: l'app deve restare adattabile e continuare a mostrare
 * la demo anche senza backend attivo, con un indicatore di stato onesto.
 */

let BASE_URL = "";

/** Usata solo dai test per puntare a un server locale invece che same-origin. */
export function setApiBaseUrl(url) {
  BASE_URL = url;
}

async function request(method, path, { token, body } = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, offline: false, status: res.status, error: data.error || "Errore dal server", data };
    }
    return { ok: true, offline: false, data };
  } catch {
    return { ok: false, offline: true, error: "Backend non raggiungibile" };
  }
}

export async function checkHealth() {
  const res = await request("GET", "/api/health");
  return res.ok;
}

export async function apiRegister(email, password, phone) {
  return request("POST", "/api/auth/register", { body: { email, password, phone } });
}

export async function apiLogin(email, password, totpCode) {
  return request("POST", "/api/auth/login", { body: { email, password, totpCode } });
}

/** Comodo per una demo a singolo form (senza toggle registrati/accedi):
 * prova il login, se l'account non esiste ancora prova a registrarlo.
 * Se anche la registrazione fallisce per email duplicata, vuol dire che
 * l'account esisteva gia' e la password era sbagliata: lo segnaliamo come
 * tale invece di mostrare un fuorviante "email gia' registrata". */
export async function loginOrRegister(email, password, phone) {
  const loginRes = await apiLogin(email, password);
  if (loginRes.ok) return loginRes;
  if (loginRes.offline) return loginRes;
  if (loginRes.data?.requires2fa) return loginRes;

  const registerRes = await apiRegister(email, password, phone);
  if (registerRes.ok) return registerRes;
  if (registerRes.offline) return registerRes;

  if (registerRes.status === 409) {
    return { ok: false, offline: false, status: 401, error: "Password sbagliata" };
  }
  return registerRes;
}

export async function apiSetup2FA(token) {
  return request("POST", "/api/auth/2fa/setup", { token });
}

export async function apiVerify2FA(token, code) {
  return request("POST", "/api/auth/2fa/verify", { token, body: { code } });
}

export async function apiGetContacts(token) {
  return request("GET", "/api/chat/contacts", { token });
}

export async function apiGetMessages(token, contactId) {
  return request("GET", `/api/chat/${contactId}/messages`, { token });
}

export async function apiSendMessage(token, contactId, text) {
  return request("POST", `/api/chat/${contactId}/messages`, { token, body: { text } });
}

export async function apiSubmitSteps(token, steps) {
  return request("POST", "/api/rewards/steps", { token, body: { steps } });
}

export async function apiGetTodayReward(token) {
  return request("GET", "/api/rewards/today", { token });
}

/** EventSource non supporta header custom: il token viaggia in query string
 * solo per questa chiamata (il server lo accetta come fallback, vedi authHelper.js). */
export function openMessageStream(token, contactId, onMessage) {
  if (typeof window === "undefined" || typeof window.EventSource === "undefined") return () => {};
  const url = `${BASE_URL}/api/chat/${contactId}/stream?token=${encodeURIComponent(token)}`;
  const source = new EventSource(url);
  source.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {
      // evento di keep-alive o non-JSON, ignorato volutamente
    }
  };
  return () => source.close();
}
