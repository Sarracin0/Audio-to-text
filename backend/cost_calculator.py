"""
Modulo per calcolare i costi delle API utilizzate
"""

import tiktoken
from typing import Dict, Tuple

# Prezzi delle API (aggiornati a Dicembre 2024)
PRICING = {
    "whisper": {
        "per_minute": 0.006  # $0.006 per minuto di audio
    },
    "claude": {
        "claude-opus-4-1-20250805": {
            "input_per_million": 15.00,   # $15 per milione di token input
            "output_per_million": 75.00   # $75 per milione di token output
        },
        "claude-3-5-sonnet-20241022": {
            "input_per_million": 3.00,    # $3 per milione di token input
            "output_per_million": 15.00   # $15 per milione di token output
        }
    }
}

def estimate_audio_duration(file_size_bytes: int, format: str = "mp3") -> float:
    """
    Stima la durata dell'audio in minuti basandosi sulla dimensione del file
    
    Args:
        file_size_bytes: Dimensione del file in bytes
        format: Formato audio (mp3, wav, etc.)
    
    Returns:
        Durata stimata in minuti
    """
    # Bitrate tipici per formato (in kbps)
    bitrates = {
        "mp3": 128,   # 128 kbps è comune per MP3
        "m4a": 128,   # AAC tipicamente 128 kbps
        "wav": 1411,  # WAV non compresso CD quality
        "flac": 800,  # FLAC compresso senza perdita
        "ogg": 160,   # Ogg Vorbis
        "aac": 128    # AAC
    }
    
    # Usa bitrate di default se formato non riconosciuto
    bitrate_kbps = bitrates.get(format.lower(), 128)
    
    # Converti in bit per secondo
    bitrate_bps = bitrate_kbps * 1000
    
    # Calcola durata in secondi
    duration_seconds = (file_size_bytes * 8) / bitrate_bps
    
    # Converti in minuti
    duration_minutes = duration_seconds / 60
    
    return duration_minutes

def count_tokens(text: str, model: str = "cl100k_base") -> int:
    """
    Conta i token in un testo usando tiktoken
    
    Args:
        text: Testo da analizzare
        model: Encoding da usare (cl100k_base per Claude/GPT-4)
    
    Returns:
        Numero di token
    """
    try:
        encoding = tiktoken.get_encoding(model)
        return len(encoding.encode(text))
    except Exception:
        # Fallback: stima approssimativa (1 token ≈ 4 caratteri)
        return len(text) // 4

def calculate_whisper_cost(duration_minutes: float) -> float:
    """
    Calcola il costo di trascrizione con Whisper
    
    Args:
        duration_minutes: Durata dell'audio in minuti
    
    Returns:
        Costo in dollari
    """
    return duration_minutes * PRICING["whisper"]["per_minute"]

def calculate_claude_cost(
    input_text: str, 
    output_text: str, 
    model: str = "claude-opus-4-1-20250805"
) -> Tuple[float, Dict[str, int]]:
    """
    Calcola il costo di elaborazione con Claude
    
    Args:
        input_text: Testo di input (prompt + trascrizione)
        output_text: Testo generato da Claude
        model: Modello Claude utilizzato
    
    Returns:
        Tupla (costo_totale, dizionario_dettagli)
    """
    # Conta i token
    input_tokens = count_tokens(input_text)
    output_tokens = count_tokens(output_text)
    
    # Ottieni prezzi per il modello
    if model not in PRICING["claude"]:
        # Se modello non riconosciuto, usa Opus come default
        model = "claude-opus-4-1-20250805"
    
    model_pricing = PRICING["claude"][model]
    
    # Calcola costi
    input_cost = (input_tokens / 1_000_000) * model_pricing["input_per_million"]
    output_cost = (output_tokens / 1_000_000) * model_pricing["output_per_million"]
    total_cost = input_cost + output_cost
    
    return total_cost, {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "input_cost": input_cost,
        "output_cost": output_cost,
        "total_cost": total_cost,
        "model": model
    }

def calculate_total_cost(
    audio_duration_minutes: float,
    transcription_text: str,
    prompt_template: str,
    processed_text: str,
    claude_model: str = "claude-opus-4-1-20250805"
) -> Dict[str, any]:
    """
    Calcola il costo totale di elaborazione di una nota
    
    Args:
        audio_duration_minutes: Durata audio in minuti
        transcription_text: Trascrizione da Whisper
        prompt_template: Template del prompt usato
        processed_text: Testo elaborato da Claude
        claude_model: Modello Claude utilizzato
    
    Returns:
        Dizionario con breakdown dei costi
    """
    # Costo Whisper
    whisper_cost = calculate_whisper_cost(audio_duration_minutes)
    
    # Costruisci input completo per Claude (prompt + trascrizione)
    claude_input = prompt_template.format(transcription=transcription_text)
    
    # Costo Claude
    claude_cost, claude_details = calculate_claude_cost(
        claude_input, 
        processed_text,
        claude_model
    )
    
    # Totale
    total_cost = whisper_cost + claude_cost
    
    return {
        "whisper": {
            "duration_minutes": round(audio_duration_minutes, 2),
            "cost_usd": round(whisper_cost, 4)
        },
        "claude": {
            "model": claude_model,
            "input_tokens": claude_details["input_tokens"],
            "output_tokens": claude_details["output_tokens"],
            "input_cost_usd": round(claude_details["input_cost"], 4),
            "output_cost_usd": round(claude_details["output_cost"], 4),
            "total_cost_usd": round(claude_cost, 4)
        },
        "total_cost_usd": round(total_cost, 4),
        "total_cost_eur": round(total_cost * 0.92, 4)  # Conversione approssimativa USD->EUR
    }

def format_cost_summary(cost_data: Dict[str, any]) -> str:
    """
    Formatta un riassunto leggibile dei costi
    
    Args:
        cost_data: Dizionario con i dati dei costi
    
    Returns:
        Stringa formattata con il riassunto
    """
    summary = f"""
📊 Riepilogo Costi:

🎙️ Whisper (Trascrizione):
   • Durata: {cost_data['whisper']['duration_minutes']:.1f} minuti
   • Costo: ${cost_data['whisper']['cost_usd']:.3f}

🤖 Claude ({cost_data['claude']['model']}):
   • Token input: {cost_data['claude']['input_tokens']:,}
   • Token output: {cost_data['claude']['output_tokens']:,}
   • Costo input: ${cost_data['claude']['input_cost_usd']:.3f}
   • Costo output: ${cost_data['claude']['output_cost_usd']:.3f}
   • Subtotale: ${cost_data['claude']['total_cost_usd']:.3f}

💰 Totale:
   • ${cost_data['total_cost_usd']:.3f} USD
   • €{cost_data['total_cost_eur']:.3f} EUR
"""
    return summary