# 🎙️ Voice to LinkedIn Post - AI Transcription System

Sistema di trascrizione e elaborazione intelligente di note vocali per creare post LinkedIn professionali usando Whisper e Claude.

## 🚀 Overview

Registra una nota vocale sul tuo iPhone → Caricala sul web → Ottieni un post LinkedIn pronto da pubblicare.

Il sistema utilizza:
- **OpenAI Whisper API** per trascrizione vocale di alta qualità
- **Claude 3.5 Sonnet** per elaborazione intelligente del testo
- **Firebase Firestore** per database
- **Cloudinary** per storage audio
- **Render + Netlify** per hosting gratuito

## 📋 Architettura

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Frontend  │────▶│   Backend   │────▶│  External    │
│  (Netlify)  │     │  (Render)   │     │   Services   │
└─────────────┘     └─────────────┘     └──────────────┘
      HTML              FastAPI           - OpenAI API
   Tailwind CSS         Python            - Claude API  
    Quill.js           uvicorn            - Cloudinary
                                          - Firestore
```

## 🔧 Tecnologie Core

### Backend (FastAPI + Python)
- **FastAPI 0.104.1**: Framework web async ad alte prestazioni
- **Python 3.11+**: Runtime principale
- **Uvicorn**: ASGI server per produzione

### AI Models
- **OpenAI Whisper API** (`whisper-1`): Trascrizione audio
  - Qualità superiore al 95% di accuratezza
  - Supporto multilingua con focus italiano
  - Costo: ~$0.006/minuto di audio

- **Anthropic Claude 3.5 Sonnet** (`claude-3-5-sonnet-20241022`): 
  - Modello più recente e performante
  - Context window: 200K tokens
  - Ottimizzato per scrittura creativa e professionale
  - Costo: ~$0.003/1K token input, $0.015/1K output

### Storage & Database
- **Firebase Firestore**: NoSQL database per metadati
  - Piano Spark gratuito (1GB storage, 50K letture/giorno)
- **Cloudinary**: Storage audio cloud
  - 25GB storage gratuito, no carta di credito

### Hosting
- **Render.com** (Backend): 
  - Free tier: 750 ore/mese
  - Auto-deploy da GitHub
  - Cold start dopo 15 min inattività
  
- **Netlify** (Frontend):
  - 100GB bandwidth gratuito
  - Deploy istantaneo
  - CDN globale

## 💰 Costi per Utilizzo

Per una nota vocale di 5 minuti:
- Whisper API: ~$0.03
- Claude API: ~$0.04  
- **Totale: ~$0.07 per post**

Infrastruttura: **$0** (tutto su tier gratuiti)

## 🎯 Features Principali

### Elaborazione Intelligente
Il sistema usa un **prompt specializzato per LinkedIn** che:
- Mantiene la tua voce autentica
- Struttura il contenuto in formato narrativo
- Aggiunge espressioni colloquiali italiane ("mah", "fidati", "una figata")
- Crea hook iniziali d'impatto
- Chiude con domande per engagement

### Due Modalità
1. **Post LinkedIn**: Ottimizzato per contenuti professionali
2. **Nota Generale**: Per appunti e trascrizioni standard

## 🛠️ Setup Locale

### Prerequisiti
```bash
python 3.11+
node 14+
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend
```bash
cd frontend
# Apri index.html nel browser o usa:
python -m http.server 8080
```

## 📝 Environment Variables

```env
# AI Services
OPENAI_API_KEY=sk-proj-xxxxx          # Per Whisper API
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx  # Per Claude

# Firebase (solo Firestore, no Storage)
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account"...}'

# Cloudinary (storage audio)
CLOUDINARY_CLOUD_NAME=dxxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx
```

## 🚀 Deploy

### Backend su Render
1. Push su GitHub
2. Connetti repository su Render
3. Configura:
   - Root Directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app:app --host 0.0.0.0 --port $PORT`
4. Aggiungi environment variables

### Frontend su Netlify
1. Aggiorna `API_URL` in `index.html` con URL Render
2. Drag & drop cartella `frontend` su Netlify
3. Deploy automatico in 10 secondi

## 📊 Performance

- **Trascrizione**: 2-5 secondi (Whisper API)
- **Elaborazione**: 3-5 secondi (Claude)
- **Upload audio**: Dipende da connessione
- **Totale**: ~10-15 secondi per nota di 5 minuti

## 🔐 Sicurezza

- API keys gestite tramite environment variables
- CORS configurato per domini specifici in produzione
- Firebase rules per accesso controllato
- HTTPS automatico su Netlify/Render

## 🐛 Troubleshooting

### "Render si addormenta"
Usa [UptimeRobot](https://uptimerobot.com) per ping ogni 5 min

### "Errore CORS"
Verifica URL backend in `frontend/index.html`

### "Upload fallito"  
Max 25MB per file su Cloudinary free tier

## 📈 Ottimizzazioni Future

- [ ] Cache delle trascrizioni per audio identici
- [ ] Batch processing per più note
- [ ] Export diretto su LinkedIn API
- [ ] Analytics su engagement dei post
- [ ] Template multipli per diversi stili

## 👨‍💻 Sviluppato da

Raffaele Zarrelli - Sistema personale per content creation efficiente

---

**Note**: Questo è un progetto personale ottimizzato per uso individuale. Per uso commerciale, considerare upgrade dei tier di hosting e API.