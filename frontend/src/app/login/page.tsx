"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Mic, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiService } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password) {
      setError('Inserisci la password')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await apiService.login(password)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-chart-1 rounded-lg flex items-center justify-center">
              <Mic className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Voice Notes</CardTitle>
          <CardDescription className="text-center">
            Inserisci la password per accedere al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-10 pl-10 pr-3 py-2 bg-background border border-input rounded-md text-sm outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              
              {error && (
                <p className="text-sm text-destructive text-center">
                  {error}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accesso in corso...
                </>
              ) : (
                'Accedi'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}