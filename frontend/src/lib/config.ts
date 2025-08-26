// Configurazione API
export const config = {
  // Usa variabile server-side per il backend (più sicuro)
  apiUrl: process.env.BACKEND_API_URL || 'http://localhost:8000',
  
  maxFileSize: 25 * 1024 * 1024, // 25MB
  
  supportedFormats: [
    'audio/mpeg',
    'audio/wav', 
    'audio/mp4',
    'audio/flac',
    'audio/ogg',
    'audio/aac'
  ],
  
  supportedExtensions: [
    '.mp3',
    '.wav',
    '.m4a',
    '.flac',
    '.ogg',
    '.aac'
  ]
}