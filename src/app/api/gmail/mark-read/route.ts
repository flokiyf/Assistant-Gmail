import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GmailClient } from '@/lib/gmail'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { messageId } = await request.json()
    
    if (!messageId) {
      return NextResponse.json(
        { error: 'ID du message requis' },
        { status: 400 }
      )
    }

    const gmailClient = new GmailClient(session.accessToken)
    await gmailClient.markAsRead(messageId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur lors du marquage comme lu:', error)
    return NextResponse.json(
      { error: 'Erreur lors du marquage comme lu' },
      { status: 500 }
    )
  }
} 