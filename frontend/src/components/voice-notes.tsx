"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Upload, Mic, Menu, Copy, Save, Loader2, FileAudio, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { apiService, Note, TranscriptionResponse } from '@/lib/api'
import { cn } from '@/lib/utils'

// Dynamic import per MD Editor (non supporta SSR)
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { 
    ssr: false,
    loading: () => <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }
)

// Configurazione file audio supportati
const FILE_CONFIG = {
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

interface ProcessingStatus {
  isProcessing: boolean
  step: string
}

export default function VoiceNotes() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [promptType, setPromptType] = useState<'linkedin' | 'general'>('linkedin')
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    step: ''
  })
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResponse | null>(null)
  const [processedText, setProcessedText] = useState('')
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carica note all'avvio
  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      console.log('Caricamento note...')
      const response = await apiService.getNotes()
      console.log('Note ricevute:', response)
      
      if (response.notes && Array.isArray(response.notes)) {
        setNotes(response.notes)
      } else {
        console.error('Formato risposta non valido:', response)
        setNotes([])
      }
    } catch (error) {
      console.error('Errore nel caricamento note:', error)
      setNotes([])
    }
  }

  const handleFileSelect = (file: File) => {
    // Validazione formato
    const isValidType = FILE_CONFIG.supportedFormats.some(format => file.type === format) ||
      FILE_CONFIG.supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))

    if (!isValidType) {
      alert('Formato file non supportato. Usa MP3, WAV, M4A, FLAC, OGG o AAC.')
      return
    }

    // Validazione dimensione
    if (file.size > FILE_CONFIG.maxFileSize) {
      alert(`File troppo grande. Dimensione massima: ${FILE_CONFIG.maxFileSize / 1024 / 1024}MB`)
      return
    }

    setSelectedFile(file)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [])

  const processAudio = async () => {
    if (!selectedFile) return

    setProcessingStatus({ isProcessing: true, step: 'Caricamento audio...' })

    try {
      setProcessingStatus({ isProcessing: true, step: 'Trascrizione con Whisper...' })
      const result = await apiService.transcribeAudio(selectedFile, promptType)

      setTranscriptionResult(result)
      // Converte il testo processato in formato markdown se necessario
      const markdownText = result.processed.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '')
      setProcessedText(markdownText)
      setCurrentNoteId(result.id)

      // Ricarica lista note
      await loadNotes()

      // Reset stato upload
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Errore durante elaborazione:', error)
      alert('Si è verificato un errore durante l\'elaborazione')
    } finally {
      setProcessingStatus({ isProcessing: false, step: '' })
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(processedText)

      // Feedback visivo
      const button = document.activeElement as HTMLButtonElement
      if (button) {
        const originalContent = button.innerHTML
        button.innerHTML = '✓ Copiato!'
        button.classList.add('!bg-green-600')
        setTimeout(() => {
          button.innerHTML = originalContent
          button.classList.remove('!bg-green-600')
        }, 2000)
      }
    } catch (error) {
      console.error('Errore nella copia:', error)
      alert('Errore durante la copia')
    }
  }

  const saveChanges = async () => {
    if (!currentNoteId) return

    try {
      console.log('Salvataggio nota:', currentNoteId)
      console.log('Testo da salvare:', processedText)
      
      await apiService.updateNote(currentNoteId, processedText)

      // Ricarica lista note dopo salvataggio
      await loadNotes()

      // Feedback visivo
      const button = document.activeElement as HTMLButtonElement
      if (button) {
        const originalContent = button.innerHTML
        button.innerHTML = '✓ Salvato!'
        button.classList.add('!bg-green-600')
        setTimeout(() => {
          button.innerHTML = originalContent
          button.classList.remove('!bg-green-600')
        }, 2000)
      }
    } catch (error) {
      console.error('Errore dettagliato nel salvataggio:', error)
      alert(`Errore durante il salvataggio: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    }
  }

  const loadNote = async (noteId: string) => {
    try {
      const response = await apiService.getNote(noteId)
      setTranscriptionResult({
        success: true,
        id: noteId,
        transcription: response.note.transcription,
        processed: response.note.processed_text,
        audio_url: response.note.audio_url
      })
      // Converte HTML in markdown se necessario
      const markdownText = response.note.processed_text.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '')
      setProcessedText(markdownText)
      setCurrentNoteId(noteId)
      setNotesDialogOpen(false)
    } catch (error) {
      console.error('Errore nel caricamento nota:', error)
      alert('Errore nel caricamento della nota')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-chart-1 rounded-lg flex items-center justify-center">
                <Mic className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold">Voice Notes</h1>
            </div>
            <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Le mie note</DialogTitle>
                  <DialogDescription>
                    Seleziona una nota per visualizzarla e modificarla
                  </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto max-h-[60vh] space-y-3 mt-4">
                  {notes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nessuna nota trovata
                    </p>
                  ) : (
                    notes.map((note) => (
                      <Card
                        key={note.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => loadNote(note.id)}
                      >
                        <CardHeader className="py-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="font-medium flex items-center gap-2">
                                <FileAudio className="h-4 w-4" />
                                {note.original_filename}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {formatDate(note.created_at)}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "text-xs px-2 py-1 rounded-full",
                                note.prompt_type === 'linkedin'
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                              )}
                            >
                              {note.prompt_type === 'linkedin' ? '📱 LinkedIn' : '📝 Generale'}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="py-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {note.transcription}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Upload Section */}
        {!transcriptionResult && !processingStatus.isProcessing && (
          <Card>
            <CardHeader>
              <CardTitle>Carica nota vocale</CardTitle>
              <CardDescription>
                Trascina o seleziona un file audio per iniziare
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selezione tipo elaborazione */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo di elaborazione</label>
                <RadioGroup value={promptType} onValueChange={(value) => setPromptType(value as 'linkedin' | 'general')}>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <RadioGroupItem value="linkedin" className="mr-2" />
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-lg">
                        📱 Post LinkedIn
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <RadioGroupItem value="general" className="mr-2" />
                      <span className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 px-3 py-1 rounded-lg">
                        📝 Nota generale
                      </span>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* Dropzone */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-muted-foreground/25 hover:border-primary/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-foreground mb-2">
                  Trascina qui il file audio o clicca per selezionare
                </p>
                <p className="text-sm text-muted-foreground">
                  Formati supportati: MP3, WAV, M4A, FLAC, OGG, AAC (max 25MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
              </div>

              {/* File info */}
              {selectedFile && (
                <div className="p-4 bg-primary/5 rounded-lg">
                  <p className="text-primary font-medium">
                    File selezionato: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                </div>
              )}

              {/* Upload button */}
              {selectedFile && (
                <Button
                  onClick={processAudio}
                  className="w-full"
                  size="lg"
                >
                  Trascrivi e Processa
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Processing Status */}
        {processingStatus.isProcessing && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">{processingStatus.step}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {transcriptionResult && !processingStatus.isProcessing && (
          <>
            {/* Trascrizione */}
            <Card>
              <CardHeader>
                <CardTitle>Trascrizione originale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="leading-relaxed whitespace-pre-wrap">{transcriptionResult.transcription}</p>
                </div>
              </CardContent>
            </Card>

            {/* Editor */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Testo elaborato</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copia
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={saveChanges}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salva
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div data-color-mode="light" className="min-h-[400px]">
                  <MDEditor
                    value={processedText}
                    onChange={(val) => setProcessedText(val || '')}
                    preview="live"
                    height={400}
                    textareaProps={{
                      placeholder: "Il testo elaborato apparirà qui..."
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Nuovo caricamento */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setTranscriptionResult(null)
                  setProcessedText('')
                  setCurrentNoteId(null)
                  setSelectedFile(null)
                }}
              >
                Carica nuova nota
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}