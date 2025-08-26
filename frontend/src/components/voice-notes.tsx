"use client"

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { FileUpload } from '@/components/file-upload'
import { ProcessingStatus } from '@/components/processing-status'
import { NoteEditor } from '@/components/note-editor'
import { NotesList } from '@/components/notes-list'
import { apiService, Note, TranscriptionResponse } from '@/lib/api'

interface ProcessingState {
  isProcessing: boolean
  step: string
}

export default function VoiceNotes() {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    step: ''
  })
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResponse | null>(null)
  const [processedText, setProcessedText] = useState('')
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Note[]>([])

  // Carica note all'avvio
  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      const response = await apiService.getNotes()
      if (response.notes && Array.isArray(response.notes)) {
        setNotes(response.notes)
      }
    } catch (error) {
      console.error('Errore nel caricamento note:', error)
      setNotes([])
    }
  }

  const handleFileProcess = async (file: File, promptType: 'linkedin' | 'general') => {
    setProcessingState({ isProcessing: true, step: 'Caricamento audio...' })

    try {
      setProcessingState({ isProcessing: true, step: 'Trascrizione con Whisper...' })
      const result = await apiService.transcribeAudio(file, promptType)

      setTranscriptionResult(result)
      // Converte il testo processato in formato markdown se necessario
      const markdownText = result.processed.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '')
      setProcessedText(markdownText)
      setCurrentNoteId(result.id)

      // Ricarica lista note
      await loadNotes()
    } catch (error) {
      console.error('Errore durante elaborazione:', error)
      alert('Si è verificato un errore durante l\'elaborazione')
    } finally {
      setProcessingState({ isProcessing: false, step: '' })
    }
  }

  const handleSaveNote = async () => {
    if (!currentNoteId) return

    try {
      await apiService.updateNote(currentNoteId, processedText)
      // Ricarica lista note dopo salvataggio
      await loadNotes()
    } catch (error) {
      console.error('Errore nel salvataggio:', error)
      throw error // Rilancia per gestione nel componente NoteEditor
    }
  }

  const handleLoadNote = async (noteId: string) => {
    try {
      const response = await apiService.getNote(noteId)
      setTranscriptionResult({
        success: true,
        id: noteId,
        transcription: response.note.transcription,
        processed: response.note.processed_text,
        audio_url: response.note.audio_url,
        cost: response.note.cost_data  // Includi i dati dei costi se presenti
      })
      // Converte HTML in markdown se necessario
      const markdownText = response.note.processed_text.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '')
      setProcessedText(markdownText)
      setCurrentNoteId(noteId)
    } catch (error) {
      console.error('Errore nel caricamento nota:', error)
      alert('Errore nel caricamento della nota')
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await apiService.deleteNote(noteId)
      
      // Se la nota eliminata è quella corrente, resetta la visualizzazione
      if (noteId === currentNoteId) {
        setTranscriptionResult(null)
        setProcessedText('')
        setCurrentNoteId(null)
      }
      
      // Ricarica lista note
      await loadNotes()
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error)
      throw error // Rilancia per gestione nel componente NoteCard
    }
  }

  const handleNewNote = () => {
    setTranscriptionResult(null)
    setProcessedText('')
    setCurrentNoteId(null)
  }

  return (
    <div className="h-screen flex flex-col bg-muted/30">
      <Header />
      
      {/* Notes list button - posizionamento assoluto rispetto al container */}
      <div className="fixed top-4 right-4 z-50">
        <NotesList 
          notes={notes}
          onNoteSelect={handleLoadNote}
          onNoteDelete={handleDeleteNote}
        />
      </div>

      {/* Main content con overflow-y-auto per permettere lo scroll */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          {/* Upload Section */}
          {!transcriptionResult && !processingState.isProcessing && (
            <FileUpload 
              onFileProcess={handleFileProcess}
              isProcessing={processingState.isProcessing}
            />
          )}

          {/* Processing Status */}
          {processingState.isProcessing && (
            <ProcessingStatus step={processingState.step} />
          )}

          {/* Results */}
          {transcriptionResult && !processingState.isProcessing && (
            <NoteEditor
              transcription={transcriptionResult}
              processedText={processedText}
              onTextChange={setProcessedText}
              onSave={handleSaveNote}
              onNewNote={handleNewNote}
            />
          )}
        </div>
      </main>
    </div>
  )
}