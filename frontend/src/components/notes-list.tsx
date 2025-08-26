"use client"

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { NoteCard } from '@/components/note-card'
import { Note } from '@/lib/api'

interface NotesListProps {
  notes: Note[]
  onNoteSelect: (noteId: string) => void
  onNoteDelete: (noteId: string) => Promise<void>
}

export function NotesList({ notes, onNoteSelect, onNoteDelete }: NotesListProps) {
  return (
    <Dialog>
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
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => onNoteSelect(note.id)}
                onDelete={onNoteDelete}
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}