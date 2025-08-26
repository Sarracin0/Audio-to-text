import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const response = await fetch(`${config.apiUrl}/api/note/${id}`)
    
    if (!response.ok) {
      throw new Error('Nota non trovata')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Errore API:', error)
    return NextResponse.json(
      { error: 'Nota non trovata' },
      { status: 404 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    
    const response = await fetch(`${config.apiUrl}/api/note/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error('Errore durante il salvataggio')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Errore API:', error)
    return NextResponse.json(
      { error: 'Errore durante il salvataggio' },
      { status: 500 }
    )
  }
}