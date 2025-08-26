import os
import json
import tempfile
import firebase_admin
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import whisper
import anthropic
from firebase_admin import credentials, firestore
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Carica variabili d'ambiente
load_dotenv()

# Inizializza Firebase Admin (solo per Firestore)
cred = credentials.Certificate(json.loads(os.getenv('FIREBASE_SERVICE_ACCOUNT')))
firebase_admin.initialize_app(cred)

# Inizializza Firestore
db = firestore.client()

# Configura Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# Inizializza FastAPI
app = FastAPI(title="Whisper Claude Notes API")

# Configura CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In produzione, specifica il dominio frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inizializza client Anthropic
claude_client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

# Thread pool per operazioni CPU intensive
executor = ThreadPoolExecutor(max_workers=2)

# Cache per il modello Whisper
whisper_model = None

def get_whisper_model():
    """Carica il modello Whisper con lazy loading"""
    global whisper_model
    if whisper_model is None:
        print("Caricamento modello Whisper large...")
        whisper_model = whisper.load_model("large")
        print("Modello Whisper caricato")
    return whisper_model

# Prompt hardcoded per Claude
CLAUDE_PROMPT = """Sei un assistente intelligente che analizza trascrizioni di note vocali.
Il tuo compito è:
1. Correggere eventuali errori di trascrizione
2. Strutturare il contenuto in modo chiaro e organizzato
3. Identificare punti chiave e azioni da intraprendere
4. Fornire un riassunto conciso alla fine

Trascrizione da analizzare:

{transcription}

Per favore, elabora questa nota vocale e restituisci una versione migliorata e strutturata."""

@app.get("/")
async def root():
    return {"message": "Whisper Claude Notes API", "status": "online"}

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Endpoint per trascrivere audio con Whisper e processare con Claude"""
    
    if not file.filename.endswith(('.mp3', '.wav', '.m4a', '.flac', '.ogg', '.aac')):
        raise HTTPException(status_code=400, detail="Formato file non supportato")
    
    try:
        # Salva il file temporaneamente
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        # Salva l'audio su Cloudinary
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        audio_filename = f"audio_{timestamp}_{file.filename}"
        
        # Upload su Cloudinary con resource_type="video" per file audio
        upload_result = cloudinary.uploader.upload(
            tmp_path,
            resource_type="video",  # Cloudinary usa "video" per audio
            folder="voice_notes",
            public_id=audio_filename,
            overwrite=True
        )
        
        audio_url = upload_result['secure_url']
        
        # Trascrivi con Whisper in thread separato
        loop = asyncio.get_event_loop()
        model = get_whisper_model()
        result = await loop.run_in_executor(executor, model.transcribe, tmp_path)
        transcription = result["text"]
        
        # Processa con Claude
        claude_response = claude_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            messages=[
                {
                    "role": "user",
                    "content": CLAUDE_PROMPT.format(transcription=transcription)
                }
            ]
        )
        
        processed_text = claude_response.content[0].text
        
        # Salva nel database Firestore
        doc_data = {
            "original_filename": file.filename,
            "audio_url": audio_url,
            "transcription": transcription,
            "processed_text": processed_text,
            "created_at": datetime.now().isoformat(),
            "timestamp": firestore.SERVER_TIMESTAMP
        }
        
        doc_ref = db.collection('notes').add(doc_data)
        doc_id = doc_ref[1].id
        
        # Pulisci file temporaneo
        os.unlink(tmp_path)
        
        return JSONResponse({
            "success": True,
            "id": doc_id,
            "transcription": transcription,
            "processed": processed_text,
            "audio_url": audio_url
        })
        
    except Exception as e:
        print(f"Errore: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/notes")
async def get_notes(limit: int = 20):
    """Recupera le note salvate"""
    try:
        notes_ref = db.collection('notes').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit)
        docs = notes_ref.stream()
        
        notes = []
        for doc in docs:
            note_data = doc.to_dict()
            note_data['id'] = doc.id
            notes.append(note_data)
        
        return JSONResponse({"success": True, "notes": notes})
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/note/{note_id}")
async def get_note(note_id: str):
    """Recupera una nota specifica"""
    try:
        doc_ref = db.collection('notes').document(note_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Nota non trovata")
        
        note_data = doc.to_dict()
        note_data['id'] = doc.id
        
        return JSONResponse({"success": True, "note": note_data})
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/note/{note_id}")
async def update_note(note_id: str, data: dict):
    """Aggiorna il testo processato di una nota"""
    try:
        doc_ref = db.collection('notes').document(note_id)
        doc_ref.update({
            'processed_text': data.get('processed_text'),
            'updated_at': datetime.now().isoformat()
        })
        
        return JSONResponse({"success": True, "message": "Nota aggiornata"})
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('PORT', 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)