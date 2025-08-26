export interface TranscriptionResponse {
  success: boolean
  id: string
  transcription: string
  processed: string
  audio_url: string
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
  // Usa le API route locali invece di chiamare direttamente il backend
  // Questo permette di nascondere l'URL del backend e gestirlo server-side
  
  async transcribeAudio(file: File, promptType: 'linkedin' | 'general' = 'linkedin'): Promise<TranscriptionResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`/api/transcribe?prompt_type=${promptType}`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.error || 'Errore durante la trascrizione')
    }

    return response.json()
  }

  async getNotes(limit: number = 20): Promise<NotesResponse> {
    const response = await fetch(`/api/notes?limit=${limit}`)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.error || 'Errore nel caricamento delle note')
    }

    return response.json()
  }

  async getNote(noteId: string): Promise<NoteResponse> {
    const response = await fetch(`/api/notes/${noteId}`)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.error || 'Nota non trovata')
    }

    return response.json()
  }

  async updateNote(noteId: string, processedText: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`/api/notes/${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ processed_text: processedText }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error('Update note error response:', errorData)
      throw new Error(errorData?.error || 'Errore durante il salvataggio')
    }

    return response.json()
  }
}

export const apiService = new ApiService()