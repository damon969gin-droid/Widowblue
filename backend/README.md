# Widow Blue Backend API

Backend FastAPI per Widow Blue - Chat, Mesh Network, Sistema Ricompense.

## 🚀 Avvio Rapido (Locale)

### Prerequisiti
- Python 3.11+
- PostgreSQL 16+
- Docker e Docker Compose (opzionale ma consigliato)

### Opzione 1: Con Docker Compose

```bash
cd backend
docker-compose up
```

L'API sarà disponibile su `http://localhost:8000`

### Opzione 2: Setup Manuale

```bash
cd backend

# Crea virtual environment
python3 -m venv venv
source venv/bin/activate  # su Windows: venv\Scripts\activate

# Installa dipendenze
pip install -r requirements.txt

# Configura .env
cp .env.example .env
# Modifica .env con i tuoi valori

# Avvia il server
uvicorn app.main:app --reload
```

L'API sarà disponibile su `http://localhost:8000`

## 📚 Documentazione API

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **OpenAPI JSON**: http://localhost:8000/api/openapi.json

## 🔐 Endpoints Principali

### Autenticazione
- `POST /api/auth/register` - Registrazione nuovo utente
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Info utente corrente
- `POST /api/auth/2fa/setup` - Setup 2FA (TOTP)
- `POST /api/auth/2fa/verify` - Verifica e abilita 2FA

### Contatti
- `GET /api/chat/contacts` - Lista contatti
- `POST /api/chat/contacts` - Crea contatto
- `POST /api/chat/contacts/batch` - Import multiple contatti
- `GET /api/chat/contacts/{contact_id}` - Dettagli contatto
- `DELETE /api/chat/contacts/{contact_id}` - Elimina contatto

### Messaggi
- `GET /api/chat/messages/{contact_id}` - Ottieni messaggi
- `POST /api/chat/messages/{contact_id}/send` - Invia messaggio
- `DELETE /api/chat/messages/{message_id}` - Elimina messaggio

### Ricompense
- `POST /api/rewards/submit-steps` - Sottometti passi, ricevi WBLU
- `GET /api/rewards/user-rewards` - Totale ricompense utente

### Sistema
- `GET /api/health` - Health check

## 🔑 Variabili di Ambiente

```env
# Database
DATABASE_URL=postgresql://widowblue:password@localhost:5432/widowblue_db

# JWT
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]

# App
DEBUG=True
ENVIRONMENT=development
API_TITLE=Widow Blue API
API_VERSION=1.0.0
```

## 📋 Workflow di Utilizzo

### 1. Registrazione e Login
```bash
# Registrazione
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","phone":"+39123456789"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Risposta**: Token JWT da usare negli header:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user_id": 1,
  "email": "user@example.com"
}
```

### 2. Setup 2FA
```bash
curl -X POST http://localhost:8000/api/auth/2fa/setup \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Risposta**: QR code in base64 per scanner con authenticator app.

### 3. Aggiungere Contatti
```bash
curl -X POST http://localhost:8000/api/chat/contacts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Marco","email":"marco@example.com","phone":"+39987654321"}'
```

### 4. Inviare Messaggi
```bash
curl -X POST http://localhost:8000/api/chat/messages/user-xxxxx/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Ciao Marco!"}'
```

### 5. Sottomettere Passi e Ricevere Ricompense
```bash
curl -X POST http://localhost:8000/api/rewards/submit-steps \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"steps":5000}'
```

## 🚀 Deploy su Render

### 1. Crea un nuovo Web Service su Render

1. Accedi a https://render.com
2. Clicca **New → Web Service**
3. Connetti il repository GitHub
4. Seleziona il branch `backend-python`
5. Configura:
   - **Name**: `widowblue-api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend`

### 2. Configura PostgreSQL su Render

1. Clicca **New → PostgreSQL**
2. Imposta nome e configurazione
3. Copia la connection string

### 3. Configura Variabili di Ambiente

Nel servizio Web, vai a **Settings → Environment** e aggiungi:

```
DATABASE_URL=postgresql://...(da Render PostgreSQL)...
SECRET_KEY=your-production-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=["https://your-frontend-url.onrender.com"]
DEBUG=False
ENVIRONMENT=production
```

### 4. Deploy

- Render auto-deploya da ogni push su `backend-python`
- L'API sarà disponibile su `https://widowblue-api.onrender.com`

## 🧪 Testing

```bash
# Test autenticazione
pytest tests/test_auth.py

# Test contatti
pytest tests/test_contacts.py

# Test messaggi
pytest tests/test_messages.py

# Tutti i test
pytest
```

## 🛠️ Sviluppo

```bash
# Formattazione codice
black .

# Lint
flake8 .

# Type checking
mypy .
```

## 📝 Note Importanti

1. **JWT Secret**: Cambia `SECRET_KEY` in produzione
2. **CORS**: Configura `CORS_ORIGINS` con il URL del frontend
3. **Database**: Usa PostgreSQL in produzione (non SQLite)
4. **2FA**: Opzionale, abilitato per chi lo desidera
5. **Rate Limiting**: Aggiungi in futuro con `slowapi`

## 🐛 Troubleshooting

### Errore: "Cannot reach database"
- Verifica connessione PostgreSQL
- Controlla `DATABASE_URL` in `.env`
- Assicurati che PostgreSQL è in esecuzione

### Errore: "JWT token expired"
- Cambia `ACCESS_TOKEN_EXPIRE_MINUTES` in `.env`
- Token di default scadono dopo 30 minuti

### Errore: "CORS error"
- Aggiungi il URL del frontend a `CORS_ORIGINS`
- Formato: `"https://example.com"` (con https in produzione)

## 📞 Support

Per problemi o domande, apri un issue nel repository.
