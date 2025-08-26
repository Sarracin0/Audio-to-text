"use client"

import { useRef, useCallback, useState, useEffect } from 'react'
import { Upload, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { MobileAudioRecorder } from '@/components/mobile-audio-recorder'
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
    'audio/aac',
    'audio/webm'
  ],
  supportedExtensions: [
    '.mp3',
    '.wav',
    '.m4a',
    '.flac',
    '.ogg',
    '.aac',
    '.webm'
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
  const [isMobile, setIsMobile] = useState(false)
  const [showRecorder, setShowRecorder] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Rileva se siamo su mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileUA = /mobile|android|iphone|ipad|phone/i.test(userAgent)
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      setIsMobile(isMobileUA || isTouchDevice)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleFileSelect = (file: File) => {
    // Validazione formato
    const isValidType = FILE_CONFIG.supportedFormats.some(format => file.type === format) ||
      FILE_CONFIG.supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))

    if (!isValidType) {
      alert('Formato file non supportato. Usa MP3, WAV, M4A, FLAC, OGG, AAC o WEBM.')
      return
    }

    // Validazione dimensione
    if (file.size > FILE_CONFIG.maxFileSize) {
      alert(`File troppo grande. Dimensione massima: ${FILE_CONFIG.maxFileSize / 1024 / 1024}MB`)
      return
    }

    setSelectedFile(file)
    setShowRecorder(false)
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
    setShowRecorder(false)
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
          {isMobile ? 'Registra o carica un file audio' : 'Trascina o seleziona un file audio per iniziare'}
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

        {/* Opzioni mobile */}
        {isMobile && !selectedFile && (
          <div className="flex gap-2">
            <Button
              variant={showRecorder ? 'default' : 'outline'}
              onClick={() => setShowRecorder(true)}
              className="flex-1"
              disabled={isProcessing}
            >
              <Mic className="h-4 w-4 mr-2" />
              Registra
            </Button>
            <Button
              variant={!showRecorder ? 'default' : 'outline'}
              onClick={() => {
                setShowRecorder(false)
                fileInputRef.current?.click()
              }}
              className="flex-1"
              disabled={isProcessing}
            >
              <Upload className="h-4 w-4 mr-2" />
              Carica file
            </Button>
          </div>
        )}

        {/* Registratore mobile */}
        {isMobile && showRecorder && !selectedFile && (
          <MobileAudioRecorder
            onFileReady={handleFileSelect}
            isProcessing={isProcessing}
          />
        )}

        {/* Dropzone desktop o area file mobile */}
        {(!isMobile || (!showRecorder && !selectedFile)) && (
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-12 text-center transition-all",
              isDragging
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-muted-foreground/25 hover:border-primary/50",
              isProcessing && "opacity-50 cursor-not-allowed",
              !isMobile && "cursor-pointer",
              isMobile && "hidden"
            )}
            onDragOver={!isMobile ? handleDragOver : undefined}
            onDragLeave={!isMobile ? handleDragLeave : undefined}
            onDrop={!isMobile ? handleDrop : undefined}
            onClick={() => !isProcessing && !isMobile && fileInputRef.current?.click()}
          >
            <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-foreground mb-2">
              Trascina qui il file audio o clicca per selezionare
            </p>
            <p className="text-sm text-muted-foreground">
              Formati supportati: MP3, WAV, M4A, FLAC, OGG, AAC (max 25MB)
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.m4a,.flac,.ogg,.aac,.webm,audio/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          disabled={isProcessing}
        />

        {/* File info */}
        {selectedFile && (
          <div className="p-4 bg-primary/5 rounded-lg">
            <p className="text-primary font-medium">
              File selezionato: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </p>
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="mt-2"
              >
                Cambia file
              </Button>
            )}
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