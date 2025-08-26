import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'

type Params = {
  id: string
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params
    
    const response = await fetch(`${config.apiUrl}/api/note/${id}`)
    
    if (!response.ok) {
      throw new Error('Nota non trovata')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Errore API GET:', error)
    return NextResponse.json(
      { error: 'Nota non trovata' },
      { status: 404 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    
    // Log per debug
    console.log('PUT request to note:', id)
    console.log('Request body:', body)
    
    const response = await fetch(`${config.apiUrl}/api/note/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend response error:', errorText)
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Errore API PUT:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore durante il salvataggio' },
      { status: 500 }
    )
  }
}