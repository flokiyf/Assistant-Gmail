import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GmailClient } from '@/lib/gmail'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      console.error('Session ou accessToken manquant:', { 
        hasSession: !!session, 
        hasAccessToken: !!session?.accessToken 
      })
      return NextResponse.json(
        { error: 'Non authentifié - Token d\'accès manquant' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const maxResults = parseInt(searchParams.get('maxResults') || '10')
    const query = searchParams.get('q')

    console.log('Tentative de récupération des emails:', { maxResults, query })

    const gmailClient = new GmailClient(session.accessToken)
    
    let messages
    if (query) {
      messages = await gmailClient.searchMessages(query, maxResults)
    } else {
      messages = await gmailClient.getMessages(maxResults)
    }

    console.log('Emails récupérés avec succès:', messages.length)
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Erreur API Gmail détaillée:', {
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })
    
    // Retourner une erreur plus détaillée
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des messages',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 