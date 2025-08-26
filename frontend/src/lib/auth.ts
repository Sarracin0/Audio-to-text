/**
 * Servizio di autenticazione per gestione token JWT
 */

const TOKEN_KEY = 'auth_token'

class AuthService {
  /**
   * Salva il token in sessionStorage (più sicuro di localStorage)
   */
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(TOKEN_KEY, token)
    }
  }

  /**
   * Recupera il token da sessionStorage
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(TOKEN_KEY)
    }
    return null
  }

  /**
   * Rimuove il token (logout)
   */
  removeToken(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(TOKEN_KEY)
    }
  }

  /**
   * Verifica se l'utente è autenticato
   */
  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  /**
   * Header di autorizzazione per le richieste API
   */
  getAuthHeaders(): HeadersInit {
    const token = this.getToken()
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
    return {
      'Content-Type': 'application/json'
    }
  }

  /**
   * Header per richieste multipart (upload file)
   */
  getAuthHeadersMultipart(): HeadersInit {
    const token = this.getToken()
    if (token) {
      return {
        'Authorization': `Bearer ${token}`
      }
    }
    return {}
  }

  /**
   * Decodifica il payload del JWT (senza verificare la firma)
   */
  decodeToken(): any | null {
    const token = this.getToken()
    if (!token) return null

    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('Errore nella decodifica del token:', error)
      return null
    }
  }

  /**
   * Verifica se il token è scaduto
   */
  isTokenExpired(): boolean {
    const payload = this.decodeToken()
    if (!payload || !payload.exp) return true
    
    const now = Date.now() / 1000
    return payload.exp < now
  }

  /**
   * Logout completo
   */
  logout(): void {
    this.removeToken()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
}

export const authService = new AuthService()