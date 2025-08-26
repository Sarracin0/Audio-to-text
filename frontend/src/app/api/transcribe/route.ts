import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const promptType = request.nextUrl.searchParams.get('prompt_type') || 'linkedin'
    const formData = await request.formData()
    
    // Proxy la richiesta al backend Python
    const response = await fetch(`${config.apiUrl}/api/transcribe?prompt_type=${promptType}`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Errore durante la trascrizione')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Errore API:', error)
    return NextResponse.json(
      { error: 'Errore durante la trascrizione' },
      { status: 500 }
    )
  }
}