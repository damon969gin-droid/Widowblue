/**
 * Test end-to-end reali: importa le funzioni delle route ed le chiama con
 * oggetti Request veri (le stesse globali Web API che Next.js usa davvero),
 * senza bisogno del server Next.js completo. Eseguire con:
 *   node --test tests/api.test.js
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.join(__dirname, "test-e2e.db");

// Punta il modulo db a un file di test isolato, pulito ad ogni run.
process.env.WIDOWBLUE_JWT_SECRET = "test-secret";
if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);

const dbModule = await import("../lib/server/db.js");
dbModule.resetDb(TEST_DB);
// Le route importano getDb() senza argomenti: sovrascriviamo la cache interna
// puntandola allo stesso file di test tramite una seconda resetDb mirata.
const originalGetDb = dbModule.getDb;

function req(method, body, headers = {}) {
  return new Request("http://localhost/test", {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const register = await import("../app/api/auth/register/route.js");
const login = await import("../app/api/auth/login/route.js");
const setup2fa = await import("../app/api/auth/2fa/setup/route.js");
const verify2fa = await import("../app/api/auth/2fa/verify/route.js");
const contacts = await import("../app/api/chat/contacts/route.js");
const messages = await import("../app/api/chat/[contactId]/messages/route.js");
const rewardsSteps = await import("../app/api/rewards/steps/route.js");
const rewardsToday = await import("../app/api/rewards/today/route.js");
const { computeReward } = await import("../lib/server/rewardsLogic.js");
const { totpNow } = await import("../lib/server/security.js");

test("reward math: lineare fino al tetto, poi bloccato a 20", () => {
  assert.equal(computeReward(0), 0);
  assert.equal(computeReward(3500), 10);
  assert.equal(computeReward(7000), 20);
  assert.equal(computeReward(15000), 20);
});

test("registrazione: crea utente e ritorna token", async () => {
  const res = await register.POST(req("POST", { email: "giulia@example.com", password: "PasswordSicura1", phone: "+391111" }));
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.ok(body.token);
  assert.equal(body.user.email, "giulia@example.com");
});

test("registrazione: rifiuta password debole", async () => {
  const res = await register.POST(req("POST", { email: "a@b.com", password: "123", phone: "1" }));
  assert.equal(res.status, 400);
});

test("registrazione: rifiuta email duplicata", async () => {
  await register.POST(req("POST", { email: "dup@example.com", password: "PasswordSicura1", phone: "1" }));
  const res = await register.POST(req("POST", { email: "dup@example.com", password: "PasswordSicura1", phone: "1" }));
  assert.equal(res.status, 409);
});

test("login: corretto ritorna token, sbagliato 401", async () => {
  await register.POST(req("POST", { email: "login@example.com", password: "PasswordSicura1", phone: "1" }));
  const ok = await login.POST(req("POST", { email: "login@example.com", password: "PasswordSicura1" }));
  assert.equal(ok.status, 200);

  const bad = await login.POST(req("POST", { email: "login@example.com", password: "sbagliata" }));
  assert.equal(bad.status, 401);
});

test("endpoint protetto senza token -> 401", async () => {
  const res = await contacts.GET(req("GET"));
  assert.equal(res.status, 401);
});

test("elenco contatti seed con token valido", async () => {
  const reg = await register.POST(req("POST", { email: "contatti@example.com", password: "PasswordSicura1", phone: "1" }));
  const { token } = await reg.json();
  const res = await contacts.GET(req("GET", undefined, { authorization: `Bearer ${token}` }));
  assert.equal(res.status, 200);
  const list = await res.json();
  assert.ok(list.find((c) => c.id === "giulia"));
  assert.ok(list.find((c) => c.id === "nodo-milano"));
});

test("ciclo 2FA completo: setup, verifica, login bloccato senza codice, login con codice ok", async () => {
  const reg = await register.POST(req("POST", { email: "sicura2@example.com", password: "PasswordSicura1", phone: "1" }));
  const { token } = await reg.json();
  const auth = { authorization: `Bearer ${token}` };

  const setup = await setup2fa.POST(req("POST", undefined, auth));
  assert.equal(setup.status, 200);
  const { secret, otpauthUri } = await setup.json();
  assert.ok(otpauthUri.startsWith("otpauth://totp/"));

  const code = totpNow(secret);
  const verify = await verify2fa.POST(req("POST", { code }, auth));
  assert.equal(verify.status, 200);

  const blocked = await login.POST(req("POST", { email: "sicura2@example.com", password: "PasswordSicura1" }));
  assert.equal(blocked.status, 401);
  const blockedBody = await blocked.json();
  assert.equal(blockedBody.requires2fa, true);

  const goodCode = totpNow(secret);
  const okLogin = await login.POST(req("POST", { email: "sicura2@example.com", password: "PasswordSicura1", totpCode: goodCode }));
  assert.equal(okLogin.status, 200);
});

test("messaggi: invio, lettura, rifiuto vuoto, contatto sconosciuto", async () => {
  const reg = await register.POST(req("POST", { email: "chat@example.com", password: "PasswordSicura1", phone: "1" }));
  const { token } = await reg.json();
  const auth = { authorization: `Bearer ${token}` };

  const sent = await messages.POST(req("POST", { text: "Ciao dal test!" }, auth), { params: { contactId: "giulia" } });
  assert.equal(sent.status, 201);

  const list = await messages.GET(req("GET", undefined, auth), { params: { contactId: "giulia" } });
  const listBody = await list.json();
  assert.ok(listBody.some((m) => m.text === "Ciao dal test!"));

  const empty = await messages.POST(req("POST", { text: "   " }, auth), { params: { contactId: "giulia" } });
  assert.equal(empty.status, 400);

  const unknown = await messages.POST(req("POST", { text: "ciao" }, auth), { params: { contactId: "non-esiste" } });
  assert.equal(unknown.status, 404);
});

test("ricompense: invio passi, tetto a 20, passi implausibili rifiutati", async () => {
  const reg = await register.POST(req("POST", { email: "passi@example.com", password: "PasswordSicura1", phone: "1" }));
  const { token } = await reg.json();
  const auth = { authorization: `Bearer ${token}` };

  const partial = await rewardsSteps.POST(req("POST", { steps: 4820 }, auth));
  const partialBody = await partial.json();
  assert.equal(partialBody.wbluAwarded, 13.77);

  const over = await rewardsSteps.POST(req("POST", { steps: 12000 }, auth));
  const overBody = await over.json();
  assert.equal(overBody.wbluAwarded, 20);

  const implausible = await rewardsSteps.POST(req("POST", { steps: 500000 }, auth));
  assert.equal(implausible.status, 422);

  const todayRes = await rewardsToday.GET(req("GET", undefined, auth));
  const todayBody = await todayRes.json();
  assert.equal(todayBody.steps, 12000);
});
