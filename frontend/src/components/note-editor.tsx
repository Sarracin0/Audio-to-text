"use client"

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Copy, Save, Edit2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CostDisplay } from '@/components/cost-display'
import { TranscriptionResponse } from '@/lib/api'

// Dynamic import per MD Editor (non supporta SSR)
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { 
    ssr: false,
    loading: () => <div className="h-96 bg-muted animate-pulse rounded-lg" />
  }
)

interface NoteEditorProps {
  transcription: TranscriptionResponse
  processedText: string
  noteTitle: string
  onTextChange: (text: string) => void
  onTitleChange: (title: string) => Promise<void>
  onSave: () => Promise<void>
  onNewNote: () => void
}

export function NoteEditor({ 
  transcription, 
  processedText, 
  noteTitle,
  onTextChange, 
  onTitleChange,
  onSave, 
  onNewNote 
}: NoteEditorProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(noteTitle)
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  
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

  const handleSave = async () => {
    try {
      await onSave()
      
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
      console.error('Errore nel salvataggio:', error)
    }
  }

  const handleEditTitle = () => {
    setIsEditingTitle(true)
    setEditedTitle(noteTitle)
  }

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) {
      setEditedTitle(noteTitle)
      setIsEditingTitle(false)
      return
    }

    if (editedTitle === noteTitle) {
      setIsEditingTitle(false)
      return
    }

    setIsSavingTitle(true)
    try {
      await onTitleChange(editedTitle)
      setIsEditingTitle(false)
    } catch (error) {
      console.error('Errore durante aggiornamento titolo:', error)
      alert('Errore durante l\'aggiornamento del titolo')
      setEditedTitle(noteTitle)
    } finally {
      setIsSavingTitle(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedTitle(noteTitle)
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  return (
    <>
      {/* Titolo della nota modificabile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  className="flex-1 px-3 py-2 text-lg font-semibold border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  autoFocus
                  disabled={isSavingTitle}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSaveTitle}
                  disabled={isSavingTitle}
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancelEdit}
                  disabled={isSavingTitle}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold flex-1">{noteTitle}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEditTitle}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Mostra i costi se disponibili */}
      {transcription.cost && (
        <CostDisplay cost={transcription.cost} />
      )}

      {/* Trascrizione */}
      <Card>
        <CardHeader>
          <CardTitle>Trascrizione originale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg">
            <p className="leading-relaxed whitespace-pre-wrap">
              {transcription.transcription}
            </p>
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
                onClick={handleSave}
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
              onChange={(val) => onTextChange(val || '')}
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
        <Button variant="outline" onClick={onNewNote}>
          Carica nuova nota
        </Button>
      </div>
    </>
  )
}