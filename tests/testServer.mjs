/**
 * Server di test minimale: monta le stesse funzioni delle route Next.js su
 * un vero http.Server di Node, cosi' si puo' collaudare lib/apiClient.js con
 * fetch reali, senza dover avviare Next.js per intero (non disponibile in
 * questo ambiente di sviluppo). Non fa parte dell'app spedita, solo dei test.
 */
import http from "http";

import * as health from "../app/api/health/route.js";
import * as register from "../app/api/auth/register/route.js";
import * as login from "../app/api/auth/login/route.js";
import * as setup2fa from "../app/api/auth/2fa/setup/route.js";
import * as verify2fa from "../app/api/auth/2fa/verify/route.js";
import * as contacts from "../app/api/chat/contacts/route.js";
import * as messages from "../app/api/chat/[contactId]/messages/route.js";
import * as stream from "../app/api/chat/[contactId]/stream/route.js";
import * as rewardsSteps from "../app/api/rewards/steps/route.js";
import * as rewardsToday from "../app/api/rewards/today/route.js";

const ROUTES = [
  { method: "GET", pattern: /^\/api\/health$/, handler: health.GET },
  { method: "POST", pattern: /^\/api\/auth\/register$/, handler: register.POST },
  { method: "POST", pattern: /^\/api\/auth\/login$/, handler: login.POST },
  { method: "POST", pattern: /^\/api\/auth\/2fa\/setup$/, handler: setup2fa.POST },
  { method: "POST", pattern: /^\/api\/auth\/2fa\/verify$/, handler: verify2fa.POST },
  { method: "GET", pattern: /^\/api\/chat\/contacts$/, handler: contacts.GET },
  { method: "GET", pattern: /^\/api\/chat\/([^/]+)\/messages$/, handler: messages.GET, param: "contactId" },
  { method: "POST", pattern: /^\/api\/chat\/([^/]+)\/messages$/, handler: messages.POST, param: "contactId" },
  { method: "GET", pattern: /^\/api\/chat\/([^/]+)\/stream$/, handler: stream.GET, param: "contactId" },
  { method: "POST", pattern: /^\/api\/rewards\/steps$/, handler: rewardsSteps.POST },
  { method: "GET", pattern: /^\/api\/rewards\/today$/, handler: rewardsToday.GET },
];

function nodeReqToWebRequest(req, bodyBuffer, origin) {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === "string") headers.set(k, v);
  }
  const init = { method: req.method, headers };
  if (bodyBuffer && bodyBuffer.length > 0) init.body = bodyBuffer;
  return new Request(new URL(req.url, origin), init);
}

async function pipeWebResponseToNode(webRes, nodeRes) {
  const headers = {};
  webRes.headers.forEach((value, key) => {
    headers[key] = value;
  });
  nodeRes.writeHead(webRes.status, headers);

  if (!webRes.body) {
    nodeRes.end();
    return;
  }
  const reader = webRes.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    nodeRes.write(Buffer.from(value));
  }
  nodeRes.end();
}

export function startTestServer(port) {
  const origin = `http://localhost:${port}`;

  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", async () => {
      const bodyBuffer = Buffer.concat(chunks);
      const url = new URL(req.url, origin);

      const route = ROUTES.find((r) => r.method === req.method && r.pattern.test(url.pathname));
      if (!route) {
        res.writeHead(404, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "not found" }));
        return;
      }

      const webReq = nodeReqToWebRequest(req, bodyBuffer, origin);
      const params = {};
      if (route.param) {
        const match = url.pathname.match(route.pattern);
        params[route.param] = decodeURIComponent(match[1]);
      }

      try {
        const webRes = await route.handler(webReq, { params });
        await pipeWebResponseToNode(webRes, res);
      } catch (err) {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve({ server, origin, close: () => server.close() }));
  });
}
