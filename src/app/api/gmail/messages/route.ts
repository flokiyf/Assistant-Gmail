import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GmailClient } from '@/lib/gmail'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const maxResults = parseInt(searchParams.get('maxResults') || '10')
    const query = searchParams.get('q')

    const gmailClient = new GmailClient(session.accessToken)
    
    let messages
    if (query) {
      messages = await gmailClient.searchMessages(query, maxResults)
    } else {
      messages = await gmailClient.getMessages(maxResults)
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Erreur API Gmail:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des messages' },
      { status: 500 }
    )
  }
} 