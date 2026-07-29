/**
 * Sicurezza lato server: hashing password (scrypt), TOTP per il 2FA (RFC 6238)
 * e firma JWT — tutto con "crypto" e "node:sqlite", nativi di Node.js.
 * Zero pacchetti esterni da installare per la logica di sicurezza.
 */
import crypto from "crypto";

// ---------- Password hashing (scrypt) ----------

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password, stored) {
  try {
    const [algo, saltHex, hashHex] = stored.split("$");
    if (algo !== "scrypt") return false;
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derived = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

// ---------- TOTP 2FA (RFC 6238 / RFC 4226) ----------

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer) {
  let bits = "";
  for (const byte of buffer) bits += byte.toString(2).padStart(8, "0");
  let output = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    output += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  return output;
}

function base32Decode(str) {
  const clean = str.replace(/=+$/, "").toUpperCase();
  let bits = "";
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function generateTotpSecret() {
  return base32Encode(crypto.randomBytes(20));
}

function hotp(secretB32, counter, digits = 6) {
  const key = base32Decode(secretB32);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac("sha1", key).update(msg).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const truncated =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(truncated % 10 ** digits).padStart(digits, "0");
}

export function totpNow(secretB32, step = 30, digits = 6) {
  const counter = Math.floor(Date.now() / 1000 / step);
  return hotp(secretB32, counter, digits);
}

export function verifyTotp(secretB32, code, step = 30, digits = 6, window = 1) {
  const counter = Math.floor(Date.now() / 1000 / step);
  const clean = String(code).trim();
  for (let delta = -window; delta <= window; delta++) {
    if (hotp(secretB32, counter + delta, digits) === clean) return true;
  }
  return false;
}

export function totpUri(secretB32, email, issuer = "WidowBlue") {
  return `otpauth://totp/${issuer}:${email}?secret=${secretB32}&issuer=${issuer}&digits=6&period=30`;
}

// ---------- JWT (HS256), implementato senza librerie esterne ----------

function base64url(input) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBuffer(input) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(input.length + ((4 - (input.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64");
}

export function signJwt(payload, secret, expiresInSeconds = 60 * 60 * 24 * 7) {
  const header = { alg: "HS256", typ: "JWT" };
  const fullPayload = { ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + expiresInSeconds };
  const headerPart = base64url(JSON.stringify(header));
  const payloadPart = base64url(JSON.stringify(fullPayload));
  const signature = crypto.createHmac("sha256", secret).update(`${headerPart}.${payloadPart}`).digest();
  const signaturePart = signature.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${headerPart}.${payloadPart}.${signaturePart}`;
}

export function verifyJwt(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Token malformato");
  const [headerPart, payloadPart, signaturePart] = parts;
  const expectedSig = crypto.createHmac("sha256", secret).update(`${headerPart}.${payloadPart}`).digest();
  const expectedSigPart = expectedSig.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  if (!crypto.timingSafeEqual(Buffer.from(signaturePart), Buffer.from(expectedSigPart))) {
    throw new Error("Firma non valida");
  }
  const payload = JSON.parse(base64urlToBuffer(payloadPart).toString("utf-8"));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw new Error("Token scaduto");
  }
  return payload;
}
