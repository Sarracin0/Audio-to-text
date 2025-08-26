"use client"

import dynamic from 'next/dynamic'
import { Copy, Save } from 'lucide-react'
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
  onTextChange: (text: string) => void
  onSave: () => Promise<void>
  onNewNote: () => void
}

export function NoteEditor({ 
  transcription, 
  processedText, 
  onTextChange, 
  onSave, 
  onNewNote 
}: NoteEditorProps) {
  
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

  return (
    <>
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