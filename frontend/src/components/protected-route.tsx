"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { apiService } from '@/lib/api'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      // Verifica se c'è un token
      if (!authService.isAuthenticated()) {
        router.push('/login')
        return
      }

      // Verifica se il token è ancora valido
      if (authService.isTokenExpired()) {
        authService.logout()
        return
      }

      try {
        // Verifica con il backend
        const isValid = await apiService.verifyAuth()
        
        if (!isValid) {
          router.push('/login')
          return
        }
        
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Errore verifica autenticazione:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifica autenticazione...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}