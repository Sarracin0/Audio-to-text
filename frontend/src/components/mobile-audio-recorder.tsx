"use client"

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Pause, Play, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MobileAudioRecorderProps {
  onFileReady: (file: File) => void
  isProcessing: boolean
}

export function MobileAudioRecorder({ onFileReady, isProcessing }: MobileAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobEvent['data'][]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Cleanup audio URL when component unmounts
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      // Richiedi permesso microfono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      })

      // Determina il MIME type supportato
      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
      } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
        mimeType = 'audio/mpeg'
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        chunksRef.current = []
        
        // Ferma tutti i track audio
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)

      // Avvia timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('Errore nell\'avvio della registrazione:', error)
      alert('Impossibile accedere al microfono. Verifica i permessi.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const pauseResumeRecording = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
        
        // Riprendi timer
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
        
        // Pausa timer
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
    }
  }

  const uploadRecording = () => {
    if (audioBlob) {
      // Crea un file dall'audio registrato
      const fileName = `registrazione_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`
      const file = new File([audioBlob], fileName, { type: audioBlob.type })
      onFileReady(file)
      
      // Reset stato
      setAudioBlob(null)
      setAudioUrl(null)
      setRecordingTime(0)
    }
  }

  const discardRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-6">
          {/* Timer */}
          {(isRecording || audioBlob) && (
            <div className="text-3xl font-mono font-semibold">
              {formatTime(recordingTime)}
            </div>
          )}

          {/* Controlli registrazione */}
          {!audioBlob ? (
            <div className="flex gap-4">
              {!isRecording ? (
                <Button
                  size="lg"
                  onClick={startRecording}
                  disabled={isProcessing}
                  className="h-16 w-16 rounded-full p-0"
                >
                  <Mic className="h-8 w-8" />
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={pauseResumeRecording}
                    className="h-16 w-16 rounded-full p-0"
                  >
                    {isPaused ? (
                      <Play className="h-8 w-8" />
                    ) : (
                      <Pause className="h-8 w-8" />
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    onClick={stopRecording}
                    className="h-16 w-16 rounded-full p-0"
                  >
                    <Square className="h-8 w-8" />
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Player audio */}
              <audio 
                controls 
                src={audioUrl || undefined}
                className="w-full max-w-xs"
              />
              
              {/* Bottoni azione */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={discardRecording}
                  disabled={isProcessing}
                >
                  Scarta
                </Button>
                <Button
                  onClick={uploadRecording}
                  disabled={isProcessing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Elabora
                </Button>
              </div>
            </>
          )}

          {/* Indicatore stato */}
          {isRecording && (
            <div className="flex items-center gap-2 text-sm">
              <div className={cn(
                "h-3 w-3 rounded-full animate-pulse",
                isPaused ? "bg-yellow-500" : "bg-red-500"
              )} />
              <span className="text-muted-foreground">
                {isPaused ? "In pausa" : "Registrazione in corso..."}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}