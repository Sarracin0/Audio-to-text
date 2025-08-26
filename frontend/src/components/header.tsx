"use client"

import { Mic, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authService } from '@/lib/auth'

export function Header() {
  const handleLogout = () => {
    authService.logout()
  }

  return (
    <header className="bg-background border-b">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-chart-1 rounded-lg flex items-center justify-center">
              <Mic className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold">Voice Notes</h1>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}