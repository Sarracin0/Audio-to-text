// Configurazione semplice - cambia questo URL con quello del tuo backend
import { authService } from './auth'

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
  title?: string
  transcription: string
  processed: string
  audio_url: string
  cost?: CostData
}

export interface Note {
  id: string
  title: string  // Nuovo campo per il titolo personalizzabile
  original_filename: string
  audio_url: string
  transcription: string
  processed_text: string
  prompt_type: string
  created_at: string
  timestamp?: string
  updated_at?: string
  cost_data?: CostData
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

export interface LoginResponse {
  success: boolean
  access_token: string
  token_type: string
}

export interface UpdateNoteData {
  processed_text?: string
  title?: string
}

class ApiService {
  
  /**
   * Gestisce errori di autenticazione
   */
  private async handleResponse(response: Response) {
    if (response.status === 401) {
      // Token scaduto o non valido
      authService.logout()
      throw new Error('Sessione scaduta. Effettua nuovamente il login.')
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Errore sconosciuto' }))
      throw new Error(error.detail || 'Errore nella richiesta')
    }
    
    return response
  }

  /**
   * Login con password
   */
  async login(password: string): Promise<LoginResponse> {
    const response = await fetch(`${BACKEND_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Password non corretta' }))
      throw new Error(error.detail || 'Errore nel login')
    }

    const data = await response.json()
    
    // Salva il token
    if (data.access_token) {
      authService.setToken(data.access_token)
    }
    
    return data
  }

  /**
   * Verifica autenticazione
   */
  async verifyAuth(): Promise<boolean> {
    if (!authService.isAuthenticated()) {
      return false
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/verify`, {
        headers: authService.getAuthHeaders(),
      })
      
      if (!response.ok) {
        authService.removeToken()
        return false
      }
      
      return true
    } catch {
      authService.removeToken()
      return false
    }
  }
  
  /**
   * Trascrivi audio con autenticazione
   */
  async transcribeAudio(file: File, promptType: 'linkedin' | 'general' = 'linkedin'): Promise<TranscriptionResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${BACKEND_URL}/api/transcribe?prompt_type=${promptType}`, {
      method: 'POST',
      headers: authService.getAuthHeadersMultipart(),
      body: formData,
    })

    await this.handleResponse(response)
    return response.json()
  }

  /**
   * Recupera note con autenticazione
   */
  async getNotes(limit: number = 20): Promise<NotesResponse> {
    const response = await fetch(`${BACKEND_URL}/api/notes?limit=${limit}`, {
      headers: authService.getAuthHeaders(),
    })
    
    await this.handleResponse(response)
    return response.json()
  }

  /**
   * Recupera una nota specifica con autenticazione
   */
  async getNote(noteId: string): Promise<NoteResponse> {
    const response = await fetch(`${BACKEND_URL}/api/note/${noteId}`, {
      headers: authService.getAuthHeaders(),
    })
    
    await this.handleResponse(response)
    return response.json()
  }

  /**
   * Aggiorna nota con autenticazione (testo e/o titolo)
   */
  async updateNote(noteId: string, data: UpdateNoteData): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${BACKEND_URL}/api/note/${noteId}`, {
      method: 'PUT',
      headers: authService.getAuthHeaders(),
      body: JSON.stringify(data),
    })

    await this.handleResponse(response)
    return response.json()
  }

  /**
   * Elimina nota con autenticazione
   */
  async deleteNote(noteId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${BACKEND_URL}/api/note/${noteId}`, {
      method: 'DELETE',
      headers: authService.getAuthHeaders(),
    })

    await this.handleResponse(response)
    return response.json()
  }
}

export const apiService = new ApiService()