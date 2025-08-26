import VoiceNotes from "@/components/voice-notes"
import { ProtectedRoute } from "@/components/protected-route"

export default function Home() {
  return (
    <ProtectedRoute>
      <VoiceNotes />
    </ProtectedRoute>
  )
}