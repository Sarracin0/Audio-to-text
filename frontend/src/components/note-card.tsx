"use client"

import { useState } from 'react'
import { FileAudio, Calendar, Trash2, Loader2, DollarSign, Edit2, Check, X } from 'lucide-react'
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
import { apiService } from '@/lib/api'

interface NoteCardProps {
  note: Note
  onClick: () => void
  onDelete: (noteId: string) => Promise<void>
  onUpdate?: () => void  // Callback per aggiornare la lista dopo modifica
}

export function NoteCard({ note, onClick, onDelete, onUpdate }: NoteCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(note.title)
  const [isSavingTitle, setIsSavingTitle] = useState(false)

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

  const handleEditTitle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditingTitle(true)
    setEditedTitle(note.title)
  }

  const handleSaveTitle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!editedTitle.trim()) {
      setEditedTitle(note.title)
      setIsEditingTitle(false)
      return
    }

    if (editedTitle === note.title) {
      setIsEditingTitle(false)
      return
    }

    setIsSavingTitle(true)
    try {
      await apiService.updateNote(note.id, { title: editedTitle })
      note.title = editedTitle // Aggiorna localmente
      setIsEditingTitle(false)
      if (onUpdate) onUpdate() // Notifica il componente padre
    } catch (error) {
      console.error('Errore durante aggiornamento titolo:', error)
      alert('Errore durante l\'aggiornamento del titolo')
      setEditedTitle(note.title) // Ripristina titolo originale
    } finally {
      setIsSavingTitle(false)
    }
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditedTitle(note.title)
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      handleSaveTitle(e as any)
    } else if (e.key === 'Escape') {
      handleCancelEdit(e as any)
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
              <div className="flex items-center gap-2">
                <FileAudio className="h-4 w-4 flex-shrink-0" />
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onKeyDown={handleTitleKeyDown}
                      className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                      autoFocus
                      disabled={isSavingTitle}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleSaveTitle}
                      disabled={isSavingTitle}
                    >
                      {isSavingTitle ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3 text-green-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleCancelEdit}
                      disabled={isSavingTitle}
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium flex-1">{note.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handleEditTitle}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(note.created_at)}
                </span>
                {note.cost_data && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${note.cost_data.total_cost_usd.toFixed(3)}
                  </span>
                )}
              </div>
              {note.title !== note.original_filename && (
                <p className="text-xs text-muted-foreground">
                  File originale: {note.original_filename}
                </p>
              )}
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
            <p className="text-sm font-medium">{note.title}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span>Creata il {formatDate(note.created_at)}</span>
              {note.cost_data && (
                <span>Costo: ${note.cost_data.total_cost_usd.toFixed(3)}</span>
              )}
            </div>
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