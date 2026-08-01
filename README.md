# Widow Blue — Web (Next.js + Tailwind + API integrate)

Un solo progetto, un solo `npm install`, un solo `npm run dev`: frontend (le schermate) e backend (autenticazione, chat, ricompense) vivono qui insieme.

[...contenuto esistente mantenuto...]

## Deploy su Render (guida rapida)
Questa sezione spiega come pubblicare l'app su Render e ottenere un URL pubblico che si aggiorna automaticamente ad ogni push su `main`.

### Prerequisiti
- Account su https://render.com collegato a GitHub.
- Branch `main` aggiornato nel repository con `package-lock.json` committato.
- Node.js 22+ (il `render.yaml` specifica automaticamente Node 22.11.0).

### Passaggi rapidi

#### 1. Assicurati di avere package-lock.json
Sulla tua macchina locale:
```bash
npm install
git add package-lock.json
git commit -m "Add package-lock.json"
git push origin main
```

#### 2. Collega Render a GitHub
1. Accedi a Render: https://render.com
2. Vai a **Settings → Connect a GitHub**
3. Autorizza Render ad accedere ai tuoi repo

#### 3. Crea il Web Service
1. Dalla dashboard Render, clicca **New → Web Service**
2. Seleziona il repository `damon969gin-droid/Widowblue`
3. Branch: `main`
4. Name: `widowblue-web`
5. Environment: `Node`
6. Plan: `Free` o `Starter` (a scelta)
7. Clicca **Create Web Service**

Render leggerà automaticamente `render.yaml` dal repository e applicherà la configurazione.

#### 4. Configura le Environment Variables
Anche se `render.yaml` le dichiara, **devi settarle nel pannello Render**:

1. Nel pannello del servizio, vai a **Settings → Environment**
2. Aggiungi/modifica:
   - `NODE_ENV` = `production`
   - `WIDOWBLUE_JWT_SECRET` = **una stringa casuale forte** (es. `openssl rand -base64 32` da terminale)
   - `WIDOWBLUE_DB_PATH` = `/data/widowblue.db`

#### 5. Configura il Persistent Disk (facoltativo ma consigliato)
Se vuoi che il database SQLite persista tra i deploy:

1. Nel pannello del servizio, vai a **Disks**
2. Clicca **Attach Persistent Disk**
3. Name: `widowblue-data`
4. Mount Path: `/data`
5. Size: `1 GB` (o più se prevedi molti messaggi)
6. Clicca **Create and Attach**

Render monterà il disco automaticamente e `WIDOWBLUE_DB_PATH=/data/widowblue.db` garantirà la persistenza.

#### 6. Deploy
1. Clicca **Deploy** nel pannello Render
2. Monitora i log in **Logs** per eventuali errori
3. Se tutto va bene, avrai un URL pubblico come `https://<servizio>.onrender.com`

### Auto Deploy
Render per default abilita il deploy automatico: ogni push su `main` triggeherà un nuovo build.

### Note Tecniche Importanti

**SQLite e Persistent Disk:**
- Senza Persistent Disk, il database verrà cancellato ad ogni deploy (ephemeral filesystem).
- Con Persistent Disk, i dati di SQLite persistono tra i deploy.
- In produzione scalabile, considera di migrare a PostgreSQL (Render Managed Postgres, AWS RDS, ecc.) e modifica `lib/server/db.js` per usare una connessione esterna.

**Sicurezza:**
- **Non committare segreti nel repo.** `WIDOWBLUE_JWT_SECRET` deve essere impostato solo su Render, non in `.env`.
- Usa `.env.example` come template (senza valori sensibili).
- Il `render.yaml` declara le variabili ma con `sync: false`, quindi i valori reali vengono sempre dal pannello Render.

**Port binding:**
- Il comando `npm run start -- -p $PORT` assicura che Next.js ascolti sulla porta che Render espone (via variabile `$PORT`).

**Node.js version:**
- Il progetto richiede Node 22+ per accedere a `node:sqlite` nativo (DatabaseSync).
- Il `render.yaml` specifica `nodeVersion: "22.11.0"`; se Render non lo rispetta, imposta la versione manualmente nel pannello → Environment.

### Troubleshooting

**Build falisce con "Cannot find module 'next'":**
- Assicurati di aver committato `package-lock.json`.
- Trigger un nuovo deploy da Render Dashboard.

**Server crasha all'avvio:**
- Controlla i log Render (Logs tab) per eventuali errori.
- Se vedi "JWT secret not set", aggiungi `WIDOWBLUE_JWT_SECRET` nelle Environment Variables.

**Database non persiste tra deploy:**
- Verifica di aver allegato il Persistent Disk (`Disks` → `widowblue-data`).
- Controlla che `WIDOWBLUE_DB_PATH=/data/widowblue.db`.

**Errore di permessi su /data:**
- Render monta il disco con permessi per il processo Node.
- Se persiste, prova a riavviare il servizio da Render Dashboard.

### Prossimi passi

Una volta deployato con successo:
- Accedi all'app tramite l'URL pubblico fornito da Render.
- Testa registrazione, login e 2FA.
- Monitora i log per eventuali runtime errors.
- Se scalare, considera di migrare a un database esterno (PostgreSQL) e di aggiungere un'istanza Redis per le sessioni.
