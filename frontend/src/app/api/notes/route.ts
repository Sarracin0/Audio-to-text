import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'

export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get('limit') || '20'
    
    const response = await fetch(`${config.apiUrl}/api/notes?limit=${limit}`)
    
    if (!response.ok) {
      throw new Error('Errore nel caricamento delle note')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Errore API:', error)
    return NextResponse.json(
      { error: 'Errore nel caricamento delle note' },
      { status: 500 }
    )
  }
}