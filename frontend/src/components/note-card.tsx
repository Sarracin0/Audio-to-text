"use client"

import { useState } from 'react'
import { FileAudio, Calendar, Trash2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Note } from '@/lib/api'

interface NoteCardProps {
  note: Note
  onClick: () => void
  onDelete: (noteId: string) => Promise<void>
}

export function NoteCard({ note, onClick, onDelete }: NoteCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation() // Previeni click sulla card
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(note.id)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Errore durante eliminazione:', error)
      alert('Errore durante l\'eliminazione della nota')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card
        className="cursor-pointer hover:bg-muted/50 transition-colors group"
        onClick={onClick}
      >
        <CardHeader className="py-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1 flex-1">
              <p className="font-medium flex items-center gap-2">
                <FileAudio className="h-4 w-4" />
                {note.original_filename}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {formatDate(note.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2">
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
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {note.transcription}
          </p>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare questa nota? L'operazione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium">{note.original_filename}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Creata il {formatDate(note.created_at)}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminazione...
                </>
              ) : (
                'Elimina'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}