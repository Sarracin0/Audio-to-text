"use client"

import { useRef, useCallback, useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

// Configurazione file audio supportati
export const FILE_CONFIG = {
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

interface FileUploadProps {
  onFileProcess: (file: File, promptType: 'linkedin' | 'general') => Promise<void>
  isProcessing: boolean
}

export function FileUpload({ onFileProcess, isProcessing }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [promptType, setPromptType] = useState<'linkedin' | 'general'>('linkedin')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleProcess = async () => {
    if (!selectedFile) return
    
    await onFileProcess(selectedFile, promptType)
    
    // Reset dopo elaborazione
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  return (
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
              : "border-muted-foreground/25 hover:border-primary/50",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
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
            disabled={isProcessing}
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
            onClick={handleProcess}
            className="w-full"
            size="lg"
            disabled={isProcessing}
          >
            Trascrivi e Processa
          </Button>
        )}
      </CardContent>
    </Card>
  )
}