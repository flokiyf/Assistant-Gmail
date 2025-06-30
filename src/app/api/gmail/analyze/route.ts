import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { analyzeEmail } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { subject, emailBody, sender } = body

    if (!subject || !emailBody || !sender) {
      return NextResponse.json({ 
        error: 'Paramètres manquants: subject, emailBody, sender requis' 
      }, { status: 400 })
    }

    // Analyser l'email avec OpenAI
    const analysis = await analyzeEmail(subject, emailBody, sender)

    return NextResponse.json({ analysis })

  } catch (error) {
    console.error('Erreur lors de l\'analyse:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de l\'analyse de l\'email' 
    }, { status: 500 })
  }
} 