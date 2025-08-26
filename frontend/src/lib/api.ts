// Configurazione semplice - cambia questo URL con quello del tuo backend
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export interface CostData {
  whisper: {
    duration_minutes: number
    cost_usd: number
  }
  claude: {
    model: string
    input_tokens: number
    output_tokens: number
    input_cost_usd: number
    output_cost_usd: number
    total_cost_usd: number
  }
  total_cost_usd: number
  total_cost_eur: number
}

export interface TranscriptionResponse {
  success: boolean
  id: string
  transcription: string
  processed: string
  audio_url: string
  cost?: CostData  // Dati dei costi opzionali
}

export interface Note {
  id: string
  original_filename: string
  audio_url: string
  transcription: string
  processed_text: string
  prompt_type: string
  created_at: string
  timestamp?: string
  updated_at?: string
  cost_data?: CostData  // Dati dei costi opzionali
  audio_duration_minutes?: number
}

export interface NotesResponse {
  success: boolean
  notes: Note[]
}

export interface NoteResponse {
  success: boolean
  note: Note
}

class ApiService {
  // Chiamate dirette al backend Python - semplice e funzionale
  
  async transcribeAudio(file: File, promptType: 'linkedin' | 'general' = 'linkedin'): Promise<TranscriptionResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${BACKEND_URL}/api/transcribe?prompt_type=${promptType}`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Errore durante la trascrizione')
    }

    return response.json()
  }

  async getNotes(limit: number = 20): Promise<NotesResponse> {
    const response = await fetch(`${BACKEND_URL}/api/notes?limit=${limit}`)
    
    if (!response.ok) {
      throw new Error('Errore nel caricamento delle note')
    }

    return response.json()
  }

  async getNote(noteId: string): Promise<NoteResponse> {
    const response = await fetch(`${BACKEND_URL}/api/note/${noteId}`)
    
    if (!response.ok) {
      throw new Error('Nota non trovata')
    }

    return response.json()
  }

  async updateNote(noteId: string, processedText: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${BACKEND_URL}/api/note/${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ processed_text: processedText }),
    })

    if (!response.ok) {
      throw new Error('Errore durante il salvataggio')
    }

    return response.json()
  }

  async deleteNote(noteId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${BACKEND_URL}/api/note/${noteId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Errore durante l\'eliminazione')
    }

    return response.json()
  }
}

export const apiService = new ApiService()