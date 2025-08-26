import os
import json
import tempfile
import firebase_admin
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import OpenAI
import anthropic
from firebase_admin import credentials, firestore
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import asyncio
from concurrent.futures import ThreadPoolExecutor
from prompts import WHISPER_PROMPT, get_prompt
from urllib.parse import urlparse
import re
from pydantic import BaseModel

# Import auth module
from auth import get_current_user, verify_password, create_access_token

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

# Inizializza client OpenAI per Whisper API
openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Inizializza client Anthropic
claude_client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

# Thread pool per operazioni CPU intensive
executor = ThreadPoolExecutor(max_workers=2)

# Pydantic models
class LoginRequest(BaseModel):
    password: str

class UpdateNoteRequest(BaseModel):
    processed_text: Optional[str] = None
    title: Optional[str] = None

def serialize_firestore_data(data: dict) -> dict:
    """Converte i tipi Firestore in tipi JSON serializzabili"""
    serialized = {}
    for key, value in data.items():
        # Gestisce DatetimeWithNanoseconds
        if hasattr(value, 'isoformat'):
            serialized[key] = value.isoformat()
        # Gestisce altri tipi datetime
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        # Salta i campi timestamp server-side che potrebbero essere None
        elif key == 'timestamp' and value is None:
            continue
        else:
            serialized[key] = value
    return serialized

def extract_cloudinary_public_id(cloudinary_url: str) -> Optional[str]:
    """
    Estrae il public_id da un URL Cloudinary
    
    Esempio URL: https://res.cloudinary.com/dxxxxx/video/upload/v1234567890/voice_notes/audio_20240101_120000_test.mp3
    Ritorna: voice_notes/audio_20240101_120000_test
    """
    try:
        # Parse dell'URL
        parsed = urlparse(cloudinary_url)
        path_parts = parsed.path.split('/')
        
        # Trova l'indice di 'upload' nel path
        if 'upload' in path_parts:
            upload_index = path_parts.index('upload')
            # Il public_id è tutto dopo 'upload' e la versione (v + numeri)
            # Salta la versione se presente (formato: v1234567890)
            start_index = upload_index + 1
            if path_parts[start_index].startswith('v') and path_parts[start_index][1:].isdigit():
                start_index += 1
            
            # Unisci le parti rimanenti per ottenere il public_id
            # Rimuovi l'estensione del file dall'ultimo elemento
            public_id_parts = path_parts[start_index:]
            if public_id_parts:
                # Rimuovi estensione dall'ultimo elemento
                last_part = public_id_parts[-1]
                # Rimuovi tutto dopo l'ultimo punto (estensione)
                last_part_without_ext = last_part.rsplit('.', 1)[0]
                public_id_parts[-1] = last_part_without_ext
                
                public_id = '/'.join(public_id_parts)
                return public_id
        
        return None
    except Exception as e:
        print(f"Errore nell'estrazione del public_id: {str(e)}")
        return None

@app.get("/")
async def root():
    """Endpoint pubblico per verificare che l'API sia online"""
    return {"message": "Whisper Claude Notes API", "status": "online"}

@app.post("/api/login")
async def login(login_data: LoginRequest):
    """Endpoint per il login - non richiede autenticazione"""
    if not verify_password(login_data.password):
        raise HTTPException(
            status_code=401,
            detail="Password non corretta"
        )
    
    # Crea token JWT
    access_token = create_access_token({
        "authenticated": True,
        "login_time": datetime.utcnow().isoformat()
    })
    
    return JSONResponse({
        "success": True,
        "access_token": access_token,
        "token_type": "bearer"
    })

@app.get("/api/verify")
async def verify_auth(current_user: dict = Depends(get_current_user)):
    """Verifica se il token è valido"""
    return JSONResponse({
        "success": True,
        "authenticated": True,
        "login_time": current_user.get("login_time")
    })

@app.post("/api/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...), 
    prompt_type: str = "linkedin",
    current_user: dict = Depends(get_current_user)  # Richiede autenticazione
):
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
        
        # Trascrivi con OpenAI Whisper API
        print("Invio audio a Whisper API...")
        
        # Apri il file audio per l'API
        with open(tmp_path, "rb") as audio_file:
            transcription_response = openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                prompt=WHISPER_PROMPT,
                language="it",  # Specifica italiano per migliori risultati
                response_format="text"
            )
        
        transcription = transcription_response
        print(f"Trascrizione completata: {len(transcription)} caratteri")
        
        # Processa con Claude usando il prompt selezionato
        claude_prompt = get_prompt(prompt_type)
        
        claude_response = claude_client.messages.create(
            model="claude-opus-4-1-20250805",
            max_tokens=2000,
            messages=[
                {
                    "role": "user",
                    "content": claude_prompt.format(transcription=transcription)
                }
            ]
        )
        
        processed_text = claude_response.content[0].text
        
        # Genera un titolo iniziale basato sul nome del file
        # Rimuovi estensione e timestamp per un titolo più leggibile
        initial_title = file.filename.rsplit('.', 1)[0]  # Rimuovi estensione
        
        # Salva nel database Firestore
        doc_data = {
            "title": initial_title,  # Nuovo campo titolo
            "original_filename": file.filename,
            "audio_url": audio_url,
            "transcription": transcription,
            "processed_text": processed_text,
            "prompt_type": prompt_type,  # Salva il tipo di prompt usato
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
            "title": initial_title,
            "transcription": transcription,
            "processed": processed_text,
            "audio_url": audio_url
        })
        
    except Exception as e:
        print(f"Errore: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/notes")
async def get_notes(
    limit: int = 20,
    current_user: dict = Depends(get_current_user)  # Richiede autenticazione
):
    """Recupera le note salvate"""
    try:
        # Ordina per created_at invece di timestamp per evitare problemi
        notes_ref = db.collection('notes').order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit)
        docs = notes_ref.stream()
        
        notes = []
        for doc in docs:
            note_data = doc.to_dict()
            # Serializza i dati Firestore
            note_data = serialize_firestore_data(note_data)
            note_data['id'] = doc.id
            
            # Assicurati che il campo title esista (per retrocompatibilità)
            if 'title' not in note_data:
                note_data['title'] = note_data.get('original_filename', 'Nota senza titolo')
            
            notes.append(note_data)
        
        return JSONResponse({"success": True, "notes": notes})
        
    except Exception as e:
        print(f"Errore nel recupero note: {str(e)}")
        # Se il problema è l'ordinamento, prova senza ordinamento
        try:
            notes_ref = db.collection('notes').limit(limit)
            docs = notes_ref.stream()
            
            notes = []
            for doc in docs:
                note_data = doc.to_dict()
                # Serializza i dati Firestore
                note_data = serialize_firestore_data(note_data)
                note_data['id'] = doc.id
                
                # Assicurati che il campo title esista (per retrocompatibilità)
                if 'title' not in note_data:
                    note_data['title'] = note_data.get('original_filename', 'Nota senza titolo')
                
                notes.append(note_data)
            
            # Ordina manualmente per created_at se esiste
            notes.sort(key=lambda x: x.get('created_at', ''), reverse=True)
            
            return JSONResponse({"success": True, "notes": notes})
        except Exception as fallback_error:
            print(f"Errore anche nel fallback: {str(fallback_error)}")
            raise HTTPException(status_code=500, detail=str(fallback_error))

@app.get("/api/note/{note_id}")
async def get_note(
    note_id: str,
    current_user: dict = Depends(get_current_user)  # Richiede autenticazione
):
    """Recupera una nota specifica"""
    try:
        doc_ref = db.collection('notes').document(note_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Nota non trovata")
        
        note_data = doc.to_dict()
        # Serializza i dati Firestore
        note_data = serialize_firestore_data(note_data)
        note_data['id'] = doc.id
        
        # Assicurati che il campo title esista (per retrocompatibilità)
        if 'title' not in note_data:
            note_data['title'] = note_data.get('original_filename', 'Nota senza titolo')
        
        return JSONResponse({"success": True, "note": note_data})
        
    except Exception as e:
        print(f"Errore nel recupero nota {note_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/note/{note_id}")
async def update_note(
    note_id: str, 
    request: UpdateNoteRequest,
    current_user: dict = Depends(get_current_user)  # Richiede autenticazione
):
    """Aggiorna il testo processato e/o il titolo di una nota"""
    try:
        # Verifica che il documento esista
        doc_ref = db.collection('notes').document(note_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Nota non trovata")
        
        # Prepara i dati da aggiornare
        update_data = {
            'updated_at': datetime.now().isoformat()
        }
        
        # Aggiungi i campi da aggiornare se presenti
        if request.processed_text is not None:
            update_data['processed_text'] = request.processed_text
            
        if request.title is not None:
            update_data['title'] = request.title
        
        # Aggiorna il documento
        doc_ref.update(update_data)
        
        print(f"Nota {note_id} aggiornata con successo")
        return JSONResponse({"success": True, "message": "Nota aggiornata"})
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Errore nell'aggiornamento nota {note_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/note/{note_id}")
async def delete_note(
    note_id: str,
    current_user: dict = Depends(get_current_user)  # Richiede autenticazione
):
    """Elimina una nota dal database e il file audio da Cloudinary"""
    try:
        doc_ref = db.collection('notes').document(note_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Nota non trovata")
        
        # Recupera i dati prima di eliminare per ottenere l'URL audio
        note_data = doc.to_dict()
        
        # Elimina l'audio da Cloudinary se presente
        if 'audio_url' in note_data and note_data['audio_url']:
            public_id = extract_cloudinary_public_id(note_data['audio_url'])
            if public_id:
                try:
                    # Elimina da Cloudinary
                    result = cloudinary.uploader.destroy(public_id, resource_type="video")
                    print(f"Eliminazione audio Cloudinary - public_id: {public_id}, risultato: {result}")
                except Exception as cloud_error:
                    # Log dell'errore ma continua con l'eliminazione della nota
                    print(f"Errore nell'eliminazione audio da Cloudinary: {str(cloud_error)}")
        
        # Elimina il documento da Firestore
        doc_ref.delete()
        
        print(f"Nota {note_id} eliminata con successo")
        return JSONResponse({"success": True, "message": "Nota e audio eliminati"})
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Errore nell'eliminazione nota {note_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv('PORT', 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)