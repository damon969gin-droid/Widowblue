# Widow Blue — Web (Next.js + Tailwind + API integrate)

Un solo progetto, un solo `npm install`, un solo `npm run dev`: frontend (le schermate) e backend (autenticazione, chat, ricompense) vivono qui insieme.

[...contenuto esistente mantenuto...]

## Deploy su Render (guida rapida)
Questa sezione spiega come pubblicare l'app su Render e ottenere un URL pubblico che si aggiorna automaticamente ad ogni push su `main`.

Prerequisiti
- Account su https://render.com collegato a GitHub.
- Branch `main` aggiornato nel repository.
- Node.js 22+ (Render usa l'ambiente Node specificato dalle variabili/setting).

Passaggi rapidi
1. Accedi a Render e collega il tuo account GitHub (Settings → Connect a GitHub).
2. Crea un nuovo Web Service:
   - New → Web Service
   - Repository: `damon969gin-droid/Widowblue`
   - Branch: `main`
   - Name: scegli `widowblue-web` o simile
   - Environment: Node
   - Plan: Free / Starter (a scelta)
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start -- -p $PORT`
     - Render imposta automaticamente la variabile `$PORT` disponibile al processo.
3. Environment Variables (Settings → Environment):
   - `WIDOWBLUE_JWT_SECRET` = una stringa forte (non usare il valore di default presente nel codice)
   - `NODE_ENV` = `production`
   - (Opzionale) `WIDOWBLUE_DB_PATH` = `/data/widowblue.db` — utile se monti un Persistent Disk
4. Persistent Disk per SQLite (opzionale ma consigliato se vuoi persistenza):
   - Nella pagina del servizio → Disks → Attach Persistent Disk → crea un disk (es. 1 GB) e montalo (Render monta tipicamente sotto `/data`).
   - Imposta `WIDOWBLUE_DB_PATH=/data/widowblue.db` nelle Environment Variables.
   - Con questo il database SQLite verrà salvato su disco persistente e sopravviverà ai deploy.
5. Auto Deploy
   - Abilita Auto Deploy (opzione di default): ogni push su `main` crea un nuovo deploy.
6. URL pubblico
   - Dopo il primo deploy Render fornisce un URL pubblico come `https://<tuo-servizio>.onrender.com`.

Note tecniche importanti
- SQLite e hosting serverless: su hosting serverless (Vercel serverless, funzioni ephemeral) il filesystem non è persistente. Render fornisce Persistent Disk se vuoi usare SQLite in produzione; altrimenti valuta Postgres.
- Per usare Postgres (più adatto alla produzione): usa un database esterno (Render Managed Postgres, AWS RDS, ecc.) e modifica `lib/server/db.js` per usare la connessione esterna (o chiedimi io di preparare la patch).
- Sicurezza: imposta `WIDOWBLUE_JWT_SECRET` in ambiente di produzione; non committare segreti nel repo.
- Porte: il comando `npm run start -- -p $PORT` assicura che Next.js ascolti la porta che Render espone.

Esempio di `.env.example`
```
# Non committare .env con segreti reali
WIDOWBLUE_JWT_SECRET=replace-with-a-strong-random-string
NODE_ENV=production
# Se usi Persistent Disk su Render impostalo come /data/widowblue.db
WIDOWBLUE_DB_PATH=/data/widowblue.db
```

Suggerimenti post-deploy
- Controlla i log del servizio su Render per eventuali errori (build/start/runtime).
- Se usi Persistent Disk, verifica i permessi e che il processo Node possa scrivere su `/data`.
- Se vuoi che l'app si aggiorni automaticamente al push su altri branch, modifica il ramo nel pannello del servizio su Render o crea servizi aggiuntivi.

Se vuoi, posso:
- aggiungere il file `.env.example` nel repository (senza valori sensibili),
- modificare `lib/server/db.js` per leggere `WIDOWBLUE_DB_PATH` da environment (consigliato),
- fornire un `render.yaml` per definire il servizio come infra-as-code.

Dimmi quali di questi preferisci che applichi automaticamente (es. aggiungere `.env.example` e aggiornare `lib/server/db.js`) o se preferisci applicarli tu manualmente. 
