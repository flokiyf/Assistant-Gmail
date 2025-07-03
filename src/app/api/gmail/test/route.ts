import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('Session de test:', {
      hasSession: !!session,
      hasAccessToken: !!session?.accessToken,
      accessTokenLength: session?.accessToken?.length,
      user: session?.user?.email
    })
    
    if (!session?.accessToken) {
      return NextResponse.json({
        error: 'Token d\'accès manquant',
        hasSession: !!session,
        userEmail: session?.user?.email || 'Non disponible'
      }, { status: 401 })
    }

    // Test simple de l'API Gmail
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('Erreur API Gmail:', data)
      return NextResponse.json({
        error: 'Erreur API Gmail',
        status: response.status,
        details: data
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile: data,
      tokenValid: true
    })

  } catch (error) {
    console.error('Erreur test Gmail:', error)
    return NextResponse.json({
      error: 'Erreur lors du test',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
} 