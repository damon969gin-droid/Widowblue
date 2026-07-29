import { verifyJwt, signJwt } from "./security.js";

const JWT_SECRET = process.env.WIDOWBLUE_JWT_SECRET || "dev-secret-change-me";

/** Legge e verifica il JWT dall'header Authorization, o da ?token= in query
 * string come fallback — necessario per lo stream SSE, perché l'API
 * EventSource del browser non permette di impostare header custom. */
export function getUserId(request) {
  const header = request.headers.get("authorization") || "";
  let token = null;
  if (header.startsWith("Bearer ")) {
    token = header.slice(7);
  } else {
    try {
      token = new URL(request.url).searchParams.get("token");
    } catch {
      token = null;
    }
  }
  if (!token) return null;
  try {
    const payload = verifyJwt(token, JWT_SECRET);
    return payload.userId;
  } catch {
    return null;
  }
}

export function signToken(userId) {
  return signJwt({ userId }, JWT_SECRET);
}

export function unauthorized() {
  return Response.json({ error: "Token mancante o non valido" }, { status: 401 });
}

