# Widow Blue — Web (Next.js + Tailwind + API integrate)

Un solo progetto, un solo `npm install`, un solo `npm run dev`: frontend (le schermate) e backend (autenticazione, chat, ricompense) vivono qui insieme. Non sono più due cose separate da far girare a parte.

## Perché non "un file solo" letterale

Frontend e backend restano due cose diverse per un motivo di sicurezza, non di comodità: il backend calcola gli hash delle password, firma i token, legge il database — se questo codice finisse nello stesso file che il browser scarica ed esegue, chiunque potrebbe leggerlo (il codice che arriva al browser è sempre ispezionabile) e vedere come sono protetti gli account. Restano separati "sotto" **lo stesso progetto**: le pagine in `app/*/page.js` girano nel browser, le API in `app/api/*/route.js` girano solo sul server, Next.js li serve insieme dallo stesso comando.

## Avvio in locale

Serve **Node.js 22.5+** (per `node:sqlite`, incluso in Node senza pacchetti aggiuntivi).

```bash
npm install
npm run dev
```

Apri http://localhost:3000 per l'app, le chiamate a `/api/...` sono già servite dallo stesso server.

## Testare per davvero

```bash
npm test
```

Esegue **19 test reali** in due file:
- `tests/api.test.js` (10 test): chiama direttamente le funzioni delle route con oggetti `Request` veri.
- `tests/apiClient.test.js` (9 test): fa partire un vero server HTTP locale (`tests/testServer.mjs`) e testa `lib/apiClient.js` con `fetch` reali contro di esso — incluso un test che apre davvero lo stream SSE, invia un messaggio, e verifica che arrivi dal vivo.

Il TOTP (2FA) è verificato anche contro il vettore di test ufficiale della RFC 6238 (non solo contro sé stesso).

**Unica cosa non testata automaticamente**: la funzione `openMessageStream` in `lib/apiClient.js`, che usa `EventSource` — un'API del browser che Node non ha, quindi non è testabile da questo ambiente a riga di comando. È un wrapper minimo e standard (5 righe) attorno a un'API nativa del browser; la parte che conta davvero — il server che apre lo stream ed emette gli eventi — è invece test coperta (vedi sopra).

## Endpoint API disponibili

| Metodo | Percorso | Cosa fa |
|---|---|---|
| POST | `/api/auth/register` | Registrazione (email, password, telefono) |
| POST | `/api/auth/login` | Login → token (richiede `totpCode` se il 2FA è attivo) |
| POST | `/api/auth/2fa/setup` | Genera segreto TOTP + URI per QR |
| POST | `/api/auth/2fa/verify` | Conferma il codice e attiva il 2FA |
| GET | `/api/chat/contacts` | Elenco contatti |
| GET/POST | `/api/chat/[contactId]/messages` | Storico / invio messaggi |
| GET | `/api/chat/[contactId]/stream` | Stream SSE in tempo reale |
| POST | `/api/rewards/steps` | Invia i passi, calcola WBLU/euro |
| GET | `/api/rewards/today` | Stato ricompense di oggi |

Tutti tranne `register`/`login` richiedono l'header `Authorization: Bearer <token>`.

## Cosa è collegato adesso (aggiornato)

Le schermate ora chiamano davvero queste API, non più solo dati finti — e si adattano da sole:

- **All'avvio**: un controllo silenzioso su `/api/health` decide se sei online o in demo. Un'etichetta accanto al logo in home lo dice sempre onestamente ("Connesso" / "Modalità demo" / "Verifica...").
- **Login**: primo utilizzo di un'email crea l'account, le volte dopo fa login vero; password sbagliata su un account esistente mostra l'errore corretto (non un fuorviante "email già registrata" — bug reale trovato e corretto durante i test, vedi sotto).
- **2FA**: attivare l'opzione nella schermata sicurezza chiama davvero `/api/auth/2fa/setup`, mostra il codice da aggiungere in un'app authenticator vera, e verifica il codice inserito con `/api/auth/2fa/verify`.
- **Contatti e ricompense**: se connesso, la home mostra i contatti veri dal database e invia i passi del giorno al backend, mostrando il calcolo fatto dal server (non più solo calcolato nel browser).
- **Chat**: aprendo una conversazione, lo storico arriva dal database e i nuovi messaggi arrivano in tempo reale via SSE — anche i tuoi, a conferma che il giro completo funziona (non vengono mostrati otticamente prima di essere confermati dal server).
- **Se il backend non risponde** (non avviato, in errore, offline): l'app non si blocca — torna da sola ai dati dimostrativi originali, con l'etichetta "Modalità demo" sempre visibile. Stessa idea di adattabilità del selettore di rete mesh/Wi-Fi/5G, applicata qui alla disponibilità del backend.

### Bug reali trovati e corretti mentre collegavo tutto questo

Non è filato tutto liscio al primo colpo, ed è giusto dirlo:
1. Un percorso di import (`@/lib/...`) funzionava nel bundler di verifica ma non con Node puro — sostituito con percorsi relativi, provati per davvero.
2. Le estensioni `.js` mancanti negli import causavano un errore in ESM nativo — aggiunte ovunque.
3. `loginOrRegister` mostrava "email già registrata" quando in realtà la password era sbagliata su un account esistente — corretto per distinguere i due casi, con un test dedicato che lo prova.

19 test in totale tra `tests/api.test.js` (le route) e `tests/apiClient.test.js` (il client contro un server vero), tutti superati dopo le correzioni.


## Cosa resta semplificato, con motivo

- **SQLite invece di Postgres**: perfetto per sviluppo/MVP; passare a Postgres in produzione cambia `lib/server/db.js`, non la logica delle route.
- **SSE invece di WebSocket**: un solo verso (server→client) ma zero dipendenze esterne, e già "tempo reale" per una chat.
- **Pub/sub in memoria di un solo processo**: su più server serve un broker condiviso (Redis), come indicato nella specifica tecnica.
- **Mesh Bluetooth**: non testabile da un server, vive sui dispositivi — resta descritto nella specifica tecnica.

## Deploy

Il modo più semplice resta [Vercel](https://vercel.com): riconosce da solo sia le pagine che le API route di Next.js, un solo deploy per entrambe. Nota: su hosting serverless il file SQLite e il pub/sub in memoria non persistono tra un'invocazione e l'altra — per un lancio vero conviene un database esterno (es. Turso, che è SQLite compatibile) e Redis per il pub/sub, entrambi con piani gratuiti per iniziare.

## Struttura

```
app/
  page.js, layout.js         pagine (frontend)
  api/.../route.js            endpoint (backend)
components/                   schermate e componenti React
lib/
  theme.js, mockData.js       dati e stile del frontend
  server/                     logica backend: sicurezza, db, ricompense
tests/
  api.test.js                 10 test reali sulle route
```

