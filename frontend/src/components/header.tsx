import { Mic } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-background border-b">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-chart-1 rounded-lg flex items-center justify-center">
            <Mic className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Voice Notes</h1>
        </div>
      </div>
    </header>
  )
}