/**
 * Test del client (lib/apiClient.js) contro un server vero in ascolto
 * (tests/testServer.mjs), non contro le funzioni delle route direttamente:
 * questo verifica anche la parte fetch/HTTP reale, un livello sopra
 * tests/api.test.js.
 */
import test from "node:test";
import { after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DB = path.join(__dirname, "test-client.db");

process.env.WIDOWBLUE_JWT_SECRET = "test-secret-client";
if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);

const dbModule = await import("../lib/server/db.js");
dbModule.resetDb(TEST_DB);

const { startTestServer } = await import("./testServer.mjs");
const api = await import("../lib/apiClient.js");

const PORT = 4791;
const { close, origin } = await startTestServer(PORT);
api.setApiBaseUrl(origin);

test("health check risponde online", async () => {
  const ok = await api.checkHealth();
  assert.equal(ok, true);
});

test("loginOrRegister crea l'account al primo utilizzo, poi fa login", async () => {
  const first = await api.loginOrRegister("cliente@example.com", "PasswordSicura1", "+391234");
  assert.equal(first.ok, true);
  assert.ok(first.data.token);

  const second = await api.loginOrRegister("cliente@example.com", "PasswordSicura1", "+391234");
  assert.equal(second.ok, true);
});

test("apiLogin rifiuta password sbagliata con errore applicativo, non offline", async () => {
  await api.loginOrRegister("altro@example.com", "PasswordSicura1", "1");
  const res = await api.apiLogin("altro@example.com", "sbagliata");
  assert.equal(res.ok, false);
  assert.equal(res.offline, false);
  assert.equal(res.status, 401);
});

test("loginOrRegister su account esistente con password sbagliata mostra 'password sbagliata', non 'email duplicata'", async () => {
  await api.loginOrRegister("esistente@example.com", "PasswordSicura1", "1");
  const res = await api.loginOrRegister("esistente@example.com", "passwordSbagliata1", "1");
  assert.equal(res.ok, false);
  assert.equal(res.error, "Password sbagliata");
});

test("ciclo 2FA completo via client reale", async () => {
  const reg = await api.loginOrRegister("2fa-client@example.com", "PasswordSicura1", "1");
  const token = reg.data.token;

  const setup = await api.apiSetup2FA(token);
  assert.equal(setup.ok, true);
  assert.ok(setup.data.secret);

  const { totpNow } = await import("../lib/server/security.js");
  const code = totpNow(setup.data.secret);
  const verify = await api.apiVerify2FA(token, code);
  assert.equal(verify.ok, true);
});

test("contatti, invio e lettura messaggi via client reale", async () => {
  const reg = await api.loginOrRegister("chat-client@example.com", "PasswordSicura1", "1");
  const token = reg.data.token;

  const contacts = await api.apiGetContacts(token);
  assert.equal(contacts.ok, true);
  assert.ok(contacts.data.find((c) => c.id === "marco"));

  const sent = await api.apiSendMessage(token, "marco", "Messaggio dal client di test");
  assert.equal(sent.ok, true);

  const list = await api.apiGetMessages(token, "marco");
  assert.ok(list.data.some((m) => m.text === "Messaggio dal client di test"));
});

test("ricompense via client reale: 4820 passi -> 13.77", async () => {
  const reg = await api.loginOrRegister("passi-client@example.com", "PasswordSicura1", "1");
  const token = reg.data.token;

  const res = await api.apiSubmitSteps(token, 4820);
  assert.equal(res.ok, true);
  assert.equal(res.data.wbluAwarded, 13.77);

  const todayRes = await api.apiGetTodayReward(token);
  assert.equal(todayRes.data.steps, 4820);
});

test("stream SSE: un messaggio inviato arriva come evento (fetch grezzo, no EventSource in Node)", async () => {
  const reg = await api.loginOrRegister("stream-client@example.com", "PasswordSicura1", "1");
  const token = reg.data.token;

  const controller = new AbortController();
  const streamRes = await fetch(`${origin}/api/chat/team/stream?token=${token}`, { signal: controller.signal });
  const reader = streamRes.body.getReader();
  const decoder = new TextDecoder();

  // consuma il primo chunk ("retry: 2000")
  await reader.read();

  await api.apiSendMessage(token, "team", "arrivato dal vivo?");

  const { value } = await reader.read();
  const text = decoder.decode(value);
  assert.match(text, /arrivato dal vivo\?/);

  controller.abort();
});

test("client segnala offline se il server non risponde (porta sbagliata)", async () => {
  api.setApiBaseUrl("http://localhost:1"); // nessun server qui
  const res = await api.apiLogin("chiunque@example.com", "qualsiasi");
  assert.equal(res.offline, true);
  api.setApiBaseUrl(origin); // ripristina per eventuali test successivi
});

after(() => {
  close();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});
